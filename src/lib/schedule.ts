// Grouping and labelling helpers for the schedule pages.
import { allEvents } from "./events";
import { dayKey, formatHour } from "./time";
import type { ScheduleEvent } from "./types";

/** The conference proper; side events run a day either side. */
export const CONFERENCE_DAYS = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"];

/** Every Houston day that has a timed event, in order. */
export const scheduleDays: string[] = [
  ...new Set(allEvents.filter((e) => e.start).map((e) => dayKey(e.start!))),
].sort();

export function eventsOnDay(day: string): ScheduleEvent[] {
  return allEvents.filter((e) => e.start && dayKey(e.start) === day);
}

/** "Day 3 of 5", or a note for the days either side of the conference. */
export function dayLabel(day: string): string {
  const i = CONFERENCE_DAYS.indexOf(day);
  if (i >= 0) return `Day ${i + 1} of ${CONFERENCE_DAYS.length}`;
  return day < CONFERENCE_DAYS[0]! ? "Before the conference" : "After the conference";
}

export type HourGroup = { label: string; key: string; events: ScheduleEvent[] };

/** Splits a day's events into "9 AM", "10 AM"… groups. Expects them sorted. */
export function groupByHour(events: ScheduleEvent[]): HourGroup[] {
  const groups: HourGroup[] = [];
  for (const event of events) {
    const label = formatHour(event.start!);
    const last = groups.at(-1);
    if (last && last.label === label) last.events.push(event);
    else groups.push({ label, key: `h-${groups.length}`, events: [event] });
  }
  return groups;
}

/** Side events listed as free, or costing nothing. */
export function isFree(event: ScheduleEvent): boolean {
  return /^(free|\$?0(\.00)?)$/i.test(event.price?.trim() ?? "");
}

/** Lower-case text the search box matches against. */
export function searchText(event: ScheduleEvent): string {
  return [event.title, event.host, event.locationLabel, ...event.speakers.map((s) => `${s.name} ${s.company ?? ""}`)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Official tracks, alphabetical, for the track filter. */
export const tracks: string[] = [
  ...new Set(allEvents.map((e) => e.track).filter((t): t is string => Boolean(t))),
].sort();
