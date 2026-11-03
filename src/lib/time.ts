// Houston-time formatting. Every date and time on the site goes through here,
// so the viewer's own time zone never changes what they see.
export const TIME_ZONE = "America/Chicago";

const clockFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric" });
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const longDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
});
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const asDate = (value: string | Date) => (typeof value === "string" ? new Date(value) : value);

/** "2:30 PM" */
export const formatTime = (value: string | Date) => clockFmt.format(asDate(value));

/** "2:30", for the timeline rail, where hour headers carry AM/PM. */
export const formatClock = (value: string | Date) => formatTime(value).replace(/\s?[AP]M$/, "");

/** "9 AM", for hour headers. */
export const formatHour = (value: string | Date) => hourFmt.format(asDate(value));

/** "Wed, Nov 4" */
export const formatDate = (value: string | Date) => dateFmt.format(asDate(value));

/** "Wednesday, November 4" */
export const formatLongDate = (value: string | Date) => longDateFmt.format(asDate(value));

/** "2026-11-04": the Houston calendar day an instant falls on. */
export const dayKey = (value: string | Date) => dayKeyFmt.format(asDate(value));

/** "10:45–11:45 AM" or "11:00 AM–12:00 PM": drops a repeated AM/PM. */
export function formatRange(start: string, end: string | null): string {
  const a = formatTime(start);
  if (!end) return a;
  const b = formatTime(end);
  const [aTime, aPeriod] = a.split(" ");
  const [, bPeriod] = b.split(" ");
  return aPeriod === bPeriod ? `${aTime}–${b}` : `${a}–${b}`;
}
