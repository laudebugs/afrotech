// Rules shared by plan and notes sync.

/** Event ids as they appear in /event/<id>/. */
export const EVENT_ID = /^[\w-]{1,64}$/;

/** A device clock running fast mustn't win every future change; clamp to now. */
const CLOCK_SLACK_MS = 5 * 60_000;

/** A device timestamp, floored and clamped to a few minutes past now; null if invalid. */
export function deviceTime(value: unknown, now = Date.now()): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.min(Math.floor(value), now + CLOCK_SLACK_MS);
}
