// Build-time access to the event data. Import from here, not from data/ directly.
import officialJson from "../../data/events/official.json";
import sideJson from "../../data/events/side.json";
import venuesJson from "../../data/venues.json";
import type { ScheduleEvent, Venue } from "./types";

export const officialEvents = officialJson as ScheduleEvent[];
export const sideEvents = sideJson as ScheduleEvent[];
export const venues = venuesJson as Record<string, Venue>;

/** Every event, sorted by start time; events without a time come last. */
export const allEvents: ScheduleEvent[] = [...officialEvents, ...sideEvents].sort((a, b) =>
  (a.start ?? "9999").localeCompare(b.start ?? "9999"),
);
