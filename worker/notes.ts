// Notes sync (plan 0005, todo 025). Each note is one row, keyed by account and
// the id its device chose, and the newest version (by updatedAt) wins. A
// deleted note stays as a row with deleted = 1 and empty text, so the deletion
// reaches the account's other devices.
//
// synced_at is the server's time of the last write. A device sends the
// cursor from its previous sync and gets back only notes written since.
import type { SignedInUser } from "./session";

export type NoteRow = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
};

const NOTE_ID = /^[\w-]{1,64}$/;
const EVENT_ID = /^[\w-]{0,64}$/;
/** In characters (string length), like the limits in src/lib/notes.ts. */
export const MAX_TITLE = 200;
export const MAX_BODY = 100_000;
export const MAX_NOTES = 1000;
const MAX_CHANGES = 100;
const CLOCK_SLACK_MS = 5 * 60_000;

type Raw = {
  id: string;
  event_id: string;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
  deleted: number;
  synced_at: number;
};

/** Notes written at or after `since` (server time), and the cursor for next time. */
export async function readNotes(env: Env, user: SignedInUser, since: number): Promise<{ notes: NoteRow[]; cursor: number }> {
  const { results } = await env.DB.prepare(
    `SELECT id, event_id, title, body, created_at, updated_at, deleted, synced_at
       FROM notes WHERE user_id = ?1 AND synced_at >= ?2`,
  )
    .bind(user.id, since)
    .all<Raw>();
  // ">=" can return a note twice across syncs, which is harmless; ">" could
  // miss one written in the same millisecond as the cursor.
  const cursor = results.reduce((max, r) => Math.max(max, r.synced_at), since);
  return {
    cursor,
    notes: results.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      title: r.title,
      body: r.body,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deleted: r.deleted === 1,
    })),
  };
}

/** Reads ?since= or a body's since: a non-negative number, else 0 (everything). */
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
  const clamp = (t: number) => Math.min(Math.floor(t), now + CLOCK_SLACK_MS);
  const out: NoteRow[] = [];
  const seen = new Set<string>();
  for (const c of changes) {
    const { id, eventId, title, body, createdAt, updatedAt, deleted } = (c ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || !NOTE_ID.test(id)) return "bad id";
    if (seen.has(id)) return "duplicate id";
    seen.add(id);
    if (typeof eventId !== "string" || !EVENT_ID.test(eventId)) return "bad eventId";
    if (deleted !== undefined && typeof deleted !== "boolean") return "bad deleted";
    const gone = deleted === true;
    if (!gone && (typeof title !== "string" || title.length > MAX_TITLE)) return "bad title";
    if (!gone && (typeof body !== "string" || body.length > MAX_BODY)) return "bad body";
    for (const t of [createdAt, updatedAt]) {
      if (typeof t !== "number" || !Number.isFinite(t) || t < 0) return "bad time";
    }
    out.push({
      id,
      eventId,
      title: gone ? "" : (title as string),
      body: gone ? "" : (body as string),
      createdAt: clamp(createdAt as number),
      updatedAt: clamp(updatedAt as number),
      deleted: gone,
    });
  }
  return out;
}

/**
 * Applies each change where it's newer than the stored note. Refuses the whole
 * request (returns false) if it would take the account past MAX_NOTES.
 */
export async function applyNoteChanges(env: Env, user: SignedInUser, changes: NoteRow[]): Promise<boolean> {
  if (!changes.length) return true;
  const adding = changes.filter((c) => !c.deleted);
  if (adding.length) {
    const live = await env.DB.prepare("SELECT id FROM notes WHERE user_id = ?1 AND deleted = 0")
      .bind(user.id)
      .all<{ id: string }>();
    const have = new Set(live.results.map((r) => r.id));
    const fresh = adding.filter((c) => !have.has(c.id)).length;
    if (have.size + fresh > MAX_NOTES) return false;
  }
  const now = Date.now();
  const stmt = env.DB.prepare(
    `INSERT INTO notes (user_id, id, event_id, title, body, deleted, created_at, updated_at, synced_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
     ON CONFLICT (user_id, id) DO UPDATE
       SET event_id = excluded.event_id, title = excluded.title, body = excluded.body,
           deleted = excluded.deleted, updated_at = excluded.updated_at, synced_at = excluded.synced_at
     WHERE excluded.updated_at > notes.updated_at`,
  );
  await env.DB.batch(
    changes.map((c) =>
      stmt.bind(user.id, c.id, c.eventId, c.title, c.body, c.deleted ? 1 : 0, c.createdAt, c.updatedAt, now),
    ),
  );
  return true;
}
