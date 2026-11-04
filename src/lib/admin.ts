// Shapes the admin dashboard's numbers for charts (plan 0011). Pure, so tests
// can run it.

export type DayCount = { day: string; n: number };

/** Houston's offset this week (CST, -06:00), as the rest of the site assumes. */
export const HOUSTON_OFFSET_MS = 6 * 3600_000;

/** The Houston date ("2026-11-04") `back` days before `now`. */
export function houstonDate(now: number, back = 0): string {
  return new Date(now - HOUSTON_OFFSET_MS - back * 86_400_000).toISOString().slice(0, 10);
}

const nextDay = (day: string) => new Date(Date.parse(`${day}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/**
 * One entry per day from `from` to `to`, with 0 for days without data. Days
 * outside the range are left out, so a stray device clock can't stretch it.
 */
export function fillDays(series: DayCount[], from: string, to: string): DayCount[] {
  const by = new Map(series.map((d) => [d.day, d.n]));
  const out: DayCount[] = [];
  for (let day = from; day <= to && out.length < 400; day = nextDay(day)) out.push({ day, n: by.get(day) ?? 0 });
  return out;
}

/**
 * The days a chart covers: from the first day with data (at most `max` days
 * back) to today, and at least the last 7 days.
 */
export function chartRange(series: DayCount[][], now: number, max = 14): { from: string; to: string } {
  const to = houstonDate(now);
  const earliest = houstonDate(now, max - 1);
  const latest = houstonDate(now, 6);
  const first = series
    .flat()
    .filter((d) => d.n > 0 && d.day >= earliest && d.day <= to)
    .map((d) => d.day)
    .sort()[0];
  return { from: first && first < latest ? first : latest, to };
}

/** "1.4 MB", "820 KB", "12 B". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`;
  return `${bytes} B`;
}

/** "Wed 4" for a chart's day labels. */
export function shortDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]} ${d.getUTCDate()}`;
}
