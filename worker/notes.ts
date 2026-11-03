// Notes sync (plan 0005, todo 025). Each note is one row, keyed by account and
// the id its device chose, and the newest version (by updatedAt) wins. A
// deleted note stays as a row with deleted = 1 and empty text, so the deletion
// reaches the account's other devices.
//
// Every write takes the next number from the account's notes_seq, inside the
// write's own transaction, so seq order is commit order. A device keeps the
// highest seq it has seen as its cursor and asks only for notes after it.
import type { SignedInUser } from "./session";
import { EVENT_ID, deviceTime } from "./sync";

export type NoteRow = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  /** Set when the server moved a fast device clock back; the device's copy then differs. */
  clamped?: boolean;
};

const NOTE_ID = /^[\w-]{1,64}$/;
/** In characters (string length), like the limits in src/lib/notes.ts. */
export const MAX_TITLE = 200;
export const MAX_BODY = 100_000;
export const MAX_NOTES = 1000;
const MAX_CHANGES = 100;
/** Notes per response; at the size limit, about 10 MB. */
const PAGE = 50;

type Raw = {
  id: string;
  event_id: string;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
  deleted: number;
  seq: number;
};

export type NotesPage = { notes: NoteRow[]; cursor: number; more: boolean; conflicts?: NoteRow[] };

const toNote = (r: Raw): NoteRow => ({
  id: r.id,
  eventId: r.event_id,
  title: r.title,
  body: r.body,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deleted: r.deleted === 1,
});

/** Whether the stored row is exactly the version the device sent. */
const same = (sent: NoteRow | undefined, r: Raw) =>
  Boolean(
    sent &&
      !sent.clamped &&
      sent.updatedAt === r.updated_at &&
      sent.deleted === (r.deleted === 1) &&
      sent.title === r.title &&
      sent.body === r.body,
  );

/**
 * The stored version of each sent note that differs from what was sent: the
 * change lost to a newer one. The device may have skipped that newer version
 * earlier (it had an edit pending), so it needs it now. Notes the server never
 * had (a deletion of an unsynced note) aren't returned.
 */
export async function readConflicts(env: Env, user: SignedInUser, sent: Map<string, NoteRow>): Promise<NoteRow[]> {
  if (!sent.size) return [];
  const { results } = await env.DB.prepare(
    `SELECT id, event_id, title, body, created_at, updated_at, deleted, seq
       FROM notes WHERE user_id = ?1 AND id IN (SELECT value FROM json_each(?2))`,
  )
    .bind(user.id, JSON.stringify([...sent.keys()]))
    .all<Raw>();
  return results.filter((r) => !same(sent.get(r.id), r)).map(toNote);
}

/**
 * One page of notes written after `since`, oldest write first. Notes stored
 * exactly as the device just sent them (`echo`) are left out, since it
 * already has them; they still move the cursor.
 */
export async function readNotes(
  env: Env,
  user: SignedInUser,
  since: number,
  echo: Map<string, NoteRow> = new Map(),
): Promise<NotesPage> {
  const { results } = await env.DB.prepare(
    `SELECT id, event_id, title, body, created_at, updated_at, deleted, seq
       FROM notes WHERE user_id = ?1 AND seq > ?2 ORDER BY seq LIMIT ?3`,
  )
    .bind(user.id, since, PAGE)
    .all<Raw>();
  return {
    cursor: results.length ? results[results.length - 1].seq : since,
    more: results.length === PAGE,
    notes: results.filter((r) => !same(echo.get(r.id), r)).map(toNote),
  };
}

/** Reads ?since= or a body's since: a non-negative whole number, else 0 (everything). */
export function parseSince(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Validates a POST body's changes; returns them or an error message. */
export function parseNoteChanges(body: unknown): NoteRow[] | string {
  const changes = (body as { changes?: unknown })?.changes;
  if (!Array.isArray(changes)) return "expected { changes: [...] }";
  if (changes.length > MAX_CHANGES) return `at most ${MAX_CHANGES} changes per request`;
  const now = Date.now();
  const out: NoteRow[] = [];
  const seen = new Set<string>();
  for (const c of changes) {
    const { id, eventId, title, body, createdAt, updatedAt, deleted } = (c ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || !NOTE_ID.test(id)) return "bad id";
    if (seen.has(id)) return "duplicate id";
    seen.add(id);
    if (typeof eventId !== "string" || (eventId !== "" && !EVENT_ID.test(eventId))) return "bad eventId";
    if (deleted !== undefined && typeof deleted !== "boolean") return "bad deleted";
    const gone = deleted === true;
    if (!gone && (typeof title !== "string" || title.length > MAX_TITLE)) return "bad title";
    if (!gone && (typeof body !== "string" || body.length > MAX_BODY)) return "bad body";
    const created = deviceTime(createdAt, now);
    const updated = deviceTime(updatedAt, now);
    if (created === null || updated === null) return "bad time";
    out.push({
      id,
      eventId,
      title: gone ? "" : (title as string),
      body: gone ? "" : (body as string),
      createdAt: created,
      updatedAt: updated,
      deleted: gone,
      clamped: updated !== Math.floor(updatedAt as number) || undefined,
    });
  }
  return out;
}

/**
 * Applies each change where it beats the stored note: a newer updatedAt wins;
 * on a tie, a deletion wins, then the greater body, so every device settles on
 * the same version. Deleting a note the server never had stores nothing.
 *
 * Returns false, changing nothing, if the request would take the account past
 * MAX_NOTES live notes. Two devices adding notes at the same moment can
 * overshoot by a few; the limit is there to stop abuse, not to be exact.
 */
export async function applyNoteChanges(env: Env, user: SignedInUser, changes: NoteRow[]): Promise<boolean> {
  if (!changes.length) return true;

  // Count live notes, and look up only the notes this request touches.
  const [count, touched] = await env.DB.batch<{ n?: number; id?: string; deleted?: number; updated_at?: number }>([
    env.DB.prepare("SELECT COUNT(*) AS n FROM notes WHERE user_id = ?1 AND deleted = 0").bind(user.id),
    env.DB.prepare(
      "SELECT id, deleted, updated_at FROM notes WHERE user_id = ?1 AND id IN (SELECT value FROM json_each(?2))",
    ).bind(user.id, JSON.stringify(changes.map((c) => c.id))),
  ]);
  const before = count.results[0]?.n ?? 0;
  const known = new Map(touched.results.map((r) => [r.id!, r]));
  let after = before;
  for (const c of changes) {
    const row = known.get(c.id);
    // A tie may or may not apply; counting it as losing is close enough here.
    if (row && c.updatedAt <= row.updated_at!) continue;
    const wasLive = row !== undefined && row.deleted === 0;
    if (c.deleted && wasLive) after--;
    if (!c.deleted && !wasLive) after++;
  }
  if (after > MAX_NOTES && after > before) return false;

  const nextSeq = "(SELECT notes_seq FROM users WHERE id = ?1) + ?2";
  const upsert = env.DB.prepare(
    `INSERT INTO notes (user_id, id, event_id, title, body, deleted, created_at, updated_at, seq)
     VALUES (?1, ?3, ?4, ?5, ?6, 0, ?7, ?8, ${nextSeq})
     ON CONFLICT (user_id, id) DO UPDATE
       SET event_id = excluded.event_id, title = excluded.title, body = excluded.body,
           deleted = 0, updated_at = excluded.updated_at, seq = excluded.seq
     WHERE excluded.updated_at > notes.updated_at
        OR (excluded.updated_at = notes.updated_at AND notes.deleted = 0 AND excluded.body > notes.body)`,
  );
  const remove = env.DB.prepare(
    `UPDATE notes SET title = '', body = '', deleted = 1, updated_at = ?4, seq = ${nextSeq}
     WHERE user_id = ?1 AND id = ?3
       AND (?4 > updated_at OR (?4 = updated_at AND deleted = 0))`,
  );
  // One transaction: each row takes notes_seq + its position, then the
  // counter moves past them all. Rows that lose leave gaps, which is fine.
  await env.DB.batch([
    ...changes.map((c, i) =>
      c.deleted
        ? remove.bind(user.id, i + 1, c.id, c.updatedAt)
        : upsert.bind(user.id, i + 1, c.id, c.eventId, c.title, c.body, c.createdAt, c.updatedAt),
    ),
    env.DB.prepare("UPDATE users SET notes_seq = notes_seq + ?2 WHERE id = ?1").bind(user.id, changes.length),
  ]);
  return true;
}
