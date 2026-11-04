// Builds /search-index.json (plan 0009): every event and speaker, with only
// what search and the filters need. Runs at build time.
import { allEvents, venues } from "./events";
import { speakers } from "./speakers";
import { isFree } from "./schedule";
import { haversineMetres, type LatLng } from "./geo";
import geocode from "../../data/geocode.json";
import floorPlan from "../../data/floor-plan.json";
import { placeOf, type SearchEvent, type SearchIndex } from "./search";

/** "Walkable" from the convention center (plan 0009). */
export const WALKABLE_METRES = 1500;

// The convention center's middle: the average of the floor plan's corners.
const corners = floorPlan.controlPoints as LatLng[];
const grb: LatLng = {
  lat: corners.reduce((s, c) => s + c.lat, 0) / corners.length,
  lng: corners.reduce((s, c) => s + c.lng, 0) / corners.length,
};
const places = geocode as Record<string, { found?: boolean; lat?: number; lng?: number }>;

function where(e: (typeof allEvents)[number]): SearchEvent["where"] {
  const venue = e.locationKey ? venues[e.locationKey] : undefined;
  const spot = e.address ? places[e.address.trim()] : undefined;
  const metres =
    spot?.found && spot.lat !== undefined && spot.lng !== undefined
      ? haversineMetres(grb, { lat: spot.lat, lng: spot.lng })
      : null;
  return placeOf(e.kind, venue?.kind, Boolean(e.address || e.locationKey), metres, WALKABLE_METRES);
}

let built: SearchIndex | null = null;

/** Built once per build and shared by the pages that need it. */
export function buildSearchIndex(): SearchIndex {
  built ??= {
    events: allEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      start: e.start,
      end: e.end,
      kind: e.kind,
      track: e.track,
      cats: e.categories,
      price: e.price,
      free: isFree(e),
      access: e.access,
      place: [e.locationLabel, e.address].filter(Boolean).join(" · "),
      host: e.host,
      people: e.speakers.map((s) => [s.name, s.company].filter(Boolean).join(" ")).join(" · "),
      // Enough description to find an event by its subject, not the whole text.
      desc: (e.description ?? "").slice(0, 300),
      pick: e.founderInvestorPick,
      where: where(e),
    })),
    speakers: speakers.map((s) => ({ slug: s.slug, name: s.name, title: s.title, company: s.company })),
  };
  return built;
}
