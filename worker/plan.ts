// Plan sync (plan 0002, todo 016): each star is its own row, and the latest
// change wins. Unstars are kept as starred = 0 so they reach other devices.
import type { SignedInUser } from "./session";
import { EVENT_ID, deviceTime } from "./sync";

export type PlanItem = { eventId: string; starred: boolean; updatedAt: number };

const MAX_CHANGES = 500;

export async function readItems(env: Env, user: SignedInUser): Promise<PlanItem[]> {
  const { results } = await env.DB.prepare(
    "SELECT event_id, starred, updated_at FROM plan_items WHERE user_id = ?1",
  )
    .bind(user.id)
    .all<{ event_id: string; starred: number; updated_at: number }>();
  return results.map((r) => ({ eventId: r.event_id, starred: r.starred === 1, updatedAt: r.updated_at }));
}

/** Validates a POST body; returns the changes or an error message. */
export function parseChanges(body: unknown): PlanItem[] | string {
  const changes = (body as { changes?: unknown })?.changes;
  if (!Array.isArray(changes)) return "expected { changes: [...] }";
  if (changes.length > MAX_CHANGES) return `at most ${MAX_CHANGES} changes per request`;
  const now = Date.now();
  const out: PlanItem[] = [];
  for (const c of changes) {
    const { eventId, starred, updatedAt } = (c ?? {}) as Record<string, unknown>;
    if (typeof eventId !== "string" || !EVENT_ID.test(eventId)) return "bad eventId";
    if (typeof starred !== "boolean") return "bad starred";
    const at = deviceTime(updatedAt, now);
    if (at === null) return "bad updatedAt";
    out.push({ eventId, starred, updatedAt: at });
  }
  return out;
}

/** Applies each change only where it's newer than what's stored. */
export async function applyChanges(env: Env, user: SignedInUser, changes: PlanItem[]): Promise<void> {
  if (!changes.length) return;
  const stmt = env.DB.prepare(
    `INSERT INTO plan_items (user_id, event_id, starred, updated_at) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT (user_id, event_id) DO UPDATE
       SET starred = excluded.starred, updated_at = excluded.updated_at
     WHERE excluded.updated_at > plan_items.updated_at`,
  );
  await env.DB.batch(changes.map((c) => stmt.bind(user.id, c.eventId, c.starred ? 1 : 0, c.updatedAt)));
}
