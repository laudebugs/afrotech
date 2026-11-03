// Photos in notes (plan 0006, todo 029). Each photo is an R2 object at
// "<user>/<id>", private to its account: there's no public URL, and these
// routes serve it only to the signed-in owner.
//
// A photo uploads only once its note has synced and the stored note links to
// it, so every photo belongs to a note. When a note is deleted, or its text
// stops linking to a photo, the photo goes too (prunePhotos).
import type { SignedInUser } from "./session";

export const PHOTO_ID = /^[\w-]{8,64}$/;
const NOTE_ID = /^[\w-]{1,64}$/;
/** The editor sends at most 1600 px WebP or JPEG, normally under 400 KB. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
/** Per account: about 800 photos at 250 KB. */
export const PHOTO_QUOTA_BYTES = 200 * 1024 * 1024;
const TYPES = new Set(["image/webp", "image/jpeg"]);

const key = (user: SignedInUser | string, id: string) => `${typeof user === "string" ? user : user.id}/${id}`;

/** Whether the bytes start like a WebP or JPEG file, whatever the header says. */
function looksLikeImage(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

export type PutResult = { status: number; error?: string };

/**
 * Stores one photo for `noteId`. Uploading the same id again changes nothing.
 * Refuses (409) while the stored note doesn't link to the photo yet: the
 * device retries after the note syncs.
 */
export async function putPhoto(
  env: Env,
  user: SignedInUser,
  id: string,
  noteId: string | null,
  request: Request,
): Promise<PutResult> {
  if (!noteId || !NOTE_ID.test(noteId)) return { status: 400, error: "missing ?note=" };
  const type = (request.headers.get("Content-Type") ?? "").split(";")[0]!.trim();
  if (!TYPES.has(type)) return { status: 415, error: "photos must be WebP or JPEG" };
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > MAX_PHOTO_BYTES) return { status: 413, error: "photo too large" };

  const existing = await env.DB.prepare("SELECT 1 FROM photos WHERE user_id = ?1 AND id = ?2")
    .bind(user.id, id)
    .first();
  if (existing) return { status: 200 };

  const note = await env.DB.prepare("SELECT body FROM notes WHERE user_id = ?1 AND id = ?2 AND deleted = 0")
    .bind(user.id, noteId)
    .first<{ body: string }>();
  if (!note?.body.includes(`photo:${id}`)) return { status: 409, error: "the note doesn't link to this photo yet" };

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) return { status: 413, error: "photo too large" };
  if (!looksLikeImage(bytes, type)) return { status: 415, error: "not a WebP or JPEG image" };

  const used = await env.DB.prepare("SELECT COALESCE(SUM(size), 0) AS n FROM photos WHERE user_id = ?1")
    .bind(user.id)
    .first<{ n: number }>();
  if ((used?.n ?? 0) + bytes.length > PHOTO_QUOTA_BYTES) return { status: 507, error: "photo storage is full" };

  await env.PHOTOS.put(key(user, id), bytes, { httpMetadata: { contentType: type } });
  await env.DB.prepare(
    `INSERT INTO photos (user_id, id, note_id, size, type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT (user_id, id) DO NOTHING`,
  )
    .bind(user.id, id, noteId, bytes.length, type, Date.now())
    .run();
  return { status: 201 };
}

/** The photo, for its owner only; null if there's no such photo. */
export async function getPhoto(env: Env, user: SignedInUser, id: string): Promise<Response | null> {
  const row = await env.DB.prepare("SELECT type FROM photos WHERE user_id = ?1 AND id = ?2")
    .bind(user.id, id)
    .first<{ type: string }>();
  if (!row) return null;
  const object = await env.PHOTOS.get(key(user, id));
  if (!object) return null;
  return new Response(object.body, {
    headers: {
      "Content-Type": row.type,
      // The device keeps its own copy (IndexedDB); a cached one could outlive
      // a deletion, so the browser's cache keeps nothing.
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}

async function remove(env: Env, userId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  await env.PHOTOS.delete(ids.map((id) => key(userId, id)));
  await env.DB.prepare("DELETE FROM photos WHERE user_id = ?1 AND id IN (SELECT value FROM json_each(?2))")
    .bind(userId, JSON.stringify(ids))
    .run();
}

/**
 * After notes change: deletes the photos of these notes that the stored notes
 * no longer link to (the note was deleted, or the photo was taken out).
 */
export async function prunePhotos(env: Env, user: SignedInUser, noteIds: string[]): Promise<void> {
  if (!noteIds.length) return;
  const { results } = await env.DB.prepare(
    `SELECT p.id, COALESCE(n.body, '') AS body
       FROM photos p LEFT JOIN notes n ON n.user_id = p.user_id AND n.id = p.note_id
      WHERE p.user_id = ?1 AND p.note_id IN (SELECT value FROM json_each(?2))`,
  )
    .bind(user.id, JSON.stringify(noteIds))
    .all<{ id: string; body: string }>();
  await remove(
    env,
    user.id,
    results.filter((r) => !r.body.includes(`photo:${r.id}`)).map((r) => r.id),
  );
}

/** "Delete my data": every photo of the account, from R2 and the table. */
export async function deleteAllPhotos(env: Env, userId: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await env.PHOTOS.list({ prefix: `${userId}/`, cursor });
    if (page.objects.length) await env.PHOTOS.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  await env.DB.prepare("DELETE FROM photos WHERE user_id = ?1").bind(userId).run();
}
