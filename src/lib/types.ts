// Shapes of the generated files in data/. scripts/build_events.py writes them and
// validates every event against the same rules, so keep the two in step.

export type EventKind = "official" | "side";

/** A speaker as listed on an event. */
export type Speaker = {
  name: string;
  title: string | null;
  company: string | null;
  /** Their profile at /speakers/<slug>/; null if removed at their request. */
  slug: string | null;
};

export type SpeakerLink = {
  kind: "linkedin" | "x" | "facebook" | "instagram" | "tiktok" | "youtube" | "github" | "website";
  label: string;
  url: string;
};

/** A speaker profile, from data/speakers.json. */
export type SpeakerProfile = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  company: string | null;
  /** The bio's first sentence or two, about 200 characters. */
  brief: string | null;
  /** Plain text; paragraphs separated by blank lines. */
  bio: string | null;
  /** Hosted by the schedule's image service (Sessionboard). */
  photoUrl: string | null;
  links: SpeakerLink[];
  sessionIds: string[];
  /** Approved, researched extras (plan 0003, Phase B); null until reviewed. */
  research: SpeakerResearch | null;
};

/** Community-compiled facts and articles, each with its source. */
export type SpeakerResearch = {
  facts: { text: string; url: string; publisher: string | null; date: string | null }[];
  articles: {
    title: string;
    url: string;
    publisher: string | null;
    date: string | null;
    kind: "article" | "talk" | "podcast" | null;
  }[];
  website: string | null;
  /** When the research was done, "2026-11-03". */
  checkedAt: string | null;
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

export type AreaKind = "hall" | "stage" | "room" | "lobby" | "balcony" | "outside" | "hotel" | "corridor";

export type MapArea = {
  level: number;
  label: string;
  kind: AreaKind;
  /** Middle of the shape, in map feet. */
  center: [number, number];
  /** True when the shape's position is a best guess (e.g. The Grove). */
  approximate: boolean;
};

/** data/floor-plan.json, written by scripts/build_floor_plan.py. */
export type FloorPlan = {
  units: "feet";
  frame: { width: number; length: number; note: string };
  /** Building corners: latitude/longitude ↔ map x/y, for placing a GPS fix. */
  controlPoints: { name: string; lat: number; lng: number; x: number; y: number }[];
  levels: Record<string, { title: string; svg: string }>;
  areas: Record<string, MapArea>;
};

/** One timed event as the Map page needs it, grouped by map area. */
export type MapEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  date: string;
  /** The place as the source wrote it, e.g. "Main Stage (Exhibit Hall E 1st Floor)". */
  place: string;
};

/** One side event as the city map needs it. */
export type CityEvent = {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  date: string;
  venue: string;
  host: string | null;
};

export type VenueKind = "grb" | "marriott" | "outdoor" | "offsite" | "unplaced";

export type Venue = {
  label: string;
  kind: VenueKind;
  address?: string;
  /** Area id in data/floor-plan.json (todo 007). Its level comes from the area. */
  areaId?: string;
  /** Floor-plan level (1–3), only for venues without an area (e.g. expo areas). */
  level?: number;
  /** True when the venue's spot within its area or level is unknown. */
  approximate?: boolean;
  /** Shown instead of a map spot, e.g. "In the exhibit halls; … hasn't published where." */
  note?: string;
  /** Added by todo 009 for places on the city map. */
  lat?: number;
  lng?: number;
};
