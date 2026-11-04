// The filters shared by week-wide search and each day's schedule (plan 0009,
// todo 038): what they are, how they live in the address, and which events
// they keep. Pure, so it runs in the browser and in tests alike.
import { eventEndMs } from "./time.ts";

/** What a filter needs to know about an event. */
export type FilterEvent = {
  id: string;
  date: string;
  start: string | null;
  end: string | null;
  kind: "official" | "side";
  track: string | null;
  cats: string[];
  free: boolean;
  access: string | null;
  where: "grb" | "near" | "city" | null;
  pick: boolean;
};

export type When = "" | "now" | "today" | "tonight";
export type TimeOfDay = "" | "morning" | "afternoon" | "evening" | "late";
export type Access = "" | "open" | "badge" | "rsvp";
export type Where = "" | "grb" | "near" | "city";

export type Filters = {
  when: When;
  /** One day, "2026-11-04"; only on the week-wide search. */
  day: string;
  time: TimeOfDay;
  kind: "" | "official" | "side";
  track: string;
  /** A side-event kind: Networking, Party, Workshop… */
  cat: string;
  free: boolean;
  access: Access;
  where: Where;
  plan: boolean;
  noclash: boolean;
  picks: boolean;
};

export const NO_FILTERS: Filters = {
  when: "", day: "", time: "", kind: "", track: "", cat: "", free: false, access: "", where: "",
  plan: false, noclash: false, picks: false,
};

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | "" =>
  allowed.includes(value as T) ? (value as T) : "";

/** Filters from the address (?when=tonight&free=1…). Unknown values are ignored. */
export function readFilters(params: URLSearchParams): Filters {
  const day = params.get("day") ?? "";
  return {
    when: pick(params.get("when"), ["now", "today", "tonight"] as const),
    day: /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "",
    time: pick(params.get("time"), ["morning", "afternoon", "evening", "late"] as const),
    kind: pick(params.get("kind"), ["official", "side"] as const),
    track: params.get("track") ?? "",
    cat: params.get("cat") ?? "",
    free: params.get("free") === "1",
    access: pick(params.get("access"), ["open", "badge", "rsvp"] as const),
    where: pick(params.get("where"), ["grb", "near", "city"] as const),
    plan: params.get("plan") === "1",
    noclash: params.get("noclash") === "1",
    picks: params.get("picks") === "1",
  };
}

/** Writes the filters that are on into params, removing the rest. */
export function writeFilters(params: URLSearchParams, f: Filters): URLSearchParams {
  const out = new URLSearchParams(params);
  for (const [key, value] of Object.entries(f)) {
    if (value === true) out.set(key, "1");
    else if (value) out.set(key, String(value));
    else out.delete(key);
  }
  return out;
}

/** How many filters are on, for the Filters button. */
export const activeCount = (f: Filters) =>
  Object.entries(f).filter(([, v]) => v !== "" && v !== false).length;

/** The Houston hour an event starts (the data carries Houston's offset). */
const startHour = (e: FilterEvent) => (e.start ? Number(e.start.slice(11, 13)) : null);

function timeOfDay(e: FilterEvent): TimeOfDay {
  const h = startHour(e);
  if (h === null) return "";
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "late";
}

/** Who can get in, from the lists' access notes; official sessions need a badge. */
export function accessOf(e: FilterEvent): Access {
  const a = (e.access ?? "").toLowerCase();
  if (e.kind === "official" || a.includes("badge")) return "badge";
  if (/rsvp|invite|approval|members|limited|waitlist/.test(a)) return "rsvp";
  return "open";
}

export type FilterContext = {
  now: number;
  /** Houston date of `now`, "2026-11-04". */
  today: string;
  planned: Set<string>;
  /** Start and end of each planned event, for "doesn't clash". */
  plannedSpans: { id: string; start: number; end: number }[];
};

const HOUR = 3600_000;

/** Today from 5 PM, or after midnight before 5 AM (listed under tomorrow). */
function isTonight(e: FilterEvent, today: string): boolean {
  const h = startHour(e);
  if (h === null) return false;
  if (e.date === today) return h >= 17;
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 24 * HOUR).toISOString().slice(0, 10);
  return e.date === tomorrow && h < 5;
}

/** Whether an event passes every filter that's on. */
export function matches(e: FilterEvent, f: Filters, ctx: FilterContext): boolean {
  const start = e.start ? Date.parse(e.start) : null;
  const end = e.start ? eventEndMs(e.start, e.end) : null;
  if (f.when === "now" && !(start !== null && end! > ctx.now && start <= ctx.now + HOUR)) return false;
  if (f.when === "today" && e.date !== ctx.today) return false;
  if (f.when === "tonight" && !isTonight(e, ctx.today)) return false;
  if (f.day && e.date !== f.day) return false;
  if (f.time && timeOfDay(e) !== f.time) return false;
  if (f.kind && e.kind !== f.kind) return false;
  if (f.track && e.track !== f.track) return false;
  if (f.cat && !e.cats.includes(f.cat)) return false;
  if (f.free && !e.free) return false;
  if (f.access && accessOf(e) !== f.access) return false;
  if (f.where && e.where !== f.where) return false;
  if (f.plan && !ctx.planned.has(e.id)) return false;
  if (f.picks && !e.pick) return false;
  if (f.noclash && start !== null) {
    const clash = ctx.plannedSpans.some((p) => p.id !== e.id && p.start < end! && start < p.end);
    if (clash) return false;
  }
  return true;
}
