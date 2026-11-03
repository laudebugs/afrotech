// Build-time access to the event data. Import from here, not from data/ directly.
import officialJson from "../../data/events/official.json";
import sideJson from "../../data/events/side.json";
import venuesJson from "../../data/venues.json";
import { floorPlan } from "./floor-plan";
import type { ScheduleEvent, Venue } from "./types";

// Every key a ScheduleEvent has. `satisfies` makes TypeScript reject this list
// if it drifts from the type, and checkEvents() rejects JSON that drifts from it.
const EVENT_KEYS = {
  id: true, kind: true, title: true, date: true, start: true, end: true, timeLabel: true,
  locationKey: true, locationLabel: true, address: true, track: true,
  categories: true, speakers: true, host: true, price: true, access: true,
  ticketLevels: true, rsvpUrl: true, founderInvestorPick: true,
  description: true, sources: true,
} satisfies Record<keyof ScheduleEvent, true>;

function checkEvents(list: unknown[], file: string): ScheduleEvent[] {
  const keys = Object.keys(EVENT_KEYS);
  for (const item of list) {
    const record = item as Record<string, unknown>;
    const missing = keys.filter((k) => !(k in record));
    const extra = Object.keys(record).filter((k) => !keys.includes(k));
    if (missing.length || extra.length) {
      throw new Error(
        `${file}: event ${String(record.id)} doesn't match ScheduleEvent ` +
          `(missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}). ` +
          "Update src/lib/types.ts and scripts/build_events.py together.",
      );
    }
  }
  return list as ScheduleEvent[];
}

export const officialEvents = checkEvents(officialJson, "data/events/official.json");
export const sideEvents = checkEvents(sideJson, "data/events/side.json");
export const venues = venuesJson as Record<string, Venue>;

// Every page loads this module, so the map data is always checked at build
// time, and every venue's map area must exist on the map.
for (const [key, venue] of Object.entries(venues)) {
  if (venue.areaId && !(venue.areaId in floorPlan.areas)) {
    throw new Error(
      `data/venues.json: ${key} points at map area ${venue.areaId}, which data/floor-plan.json doesn't have.`,
    );
  }
}

/** Every event, sorted by start time; events without a time come last. */
export const allEvents: ScheduleEvent[] = [...officialEvents, ...sideEvents].sort((a, b) =>
  (a.start ?? "9999").localeCompare(b.start ?? "9999"),
);
