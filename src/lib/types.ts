// Shapes of the generated files in data/. scripts/build_events.py writes them and
// validates every event against the same rules, so keep the two in step.

export type EventKind = "official" | "side";

export type Speaker = {
  name: string;
  title: string | null;
  company: string | null;
};

/** One event, official or side. Named ScheduleEvent to avoid the DOM's Event. */
export type ScheduleEvent = {
  /** Official: the schedule's uuid. Side: "side-" + hash of date and title. */
  id: string;
  kind: EventKind;
  title: string;
  /** Houston calendar day, "2026-11-04". Set even when the time is TBA. */
  date: string;
  /** ISO 8601 with Houston's offset, e.g. "2026-11-04T19:00:00-06:00". */
  start: string | null;
  end: string | null;
  /** Shown instead of a time when start is null, e.g. "TBA". */
  timeLabel: string | null;
  /** Key into data/venues.json. */
  locationKey: string | null;
  /** The place as the source wrote it. */
  locationLabel: string;
  address: string | null;
  track: string | null;
  categories: string[];
  speakers: Speaker[];
  host: string | null;
  price: string | null;
  /** "Open", "Invite only", "Badge"… (side events). */
  access: string | null;
  /** Conference passes that admit you (official sessions). */
  ticketLevels: string[];
  rsvpUrl: string | null;
  founderInvestorPick: boolean;
  description: string | null;
  sources: string[];
};

/** data/floor-plan.json, written by scripts/build_floor_plan.py. */
export type FloorPlan = {
  units: string;
  frame: { width: number; length: number; note: string };
  /** Building corners: latitude/longitude ↔ map x/y, for placing a GPS fix. */
  controlPoints: { name: string; lat: number; lng: number; x: number; y: number }[];
  levels: Record<string, { title: string; svg: string }>;
  areas: Record<
    string,
    { level: number; label: string; kind: string; center: number[]; approximate: boolean }
  >;
};

export type VenueKind = "grb" | "marriott" | "outdoor" | "offsite" | "unplaced";

export type Venue = {
  label: string;
  kind: VenueKind;
  address?: string;
  /** Floor-plan level (1–3) and area id in data/floor-plan.json (todo 007). */
  level?: number;
  areaId?: string;
  /** True when the spot is a best guess, e.g. an expo area inside the halls. */
  approximate?: boolean;
  /** Shown instead of a map spot, e.g. "In the exhibit halls; … hasn't published where." */
  note?: string;
  /** Added by todo 009 for places on the city map. */
  lat?: number;
  lng?: number;
};
