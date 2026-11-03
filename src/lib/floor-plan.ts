// The traced convention center map: areas, levels and the building's
// real-world corners. Written by scripts/build_floor_plan.py.
import planJson from "../../data/floor-plan.json";
import { floorPlanTransform } from "./geo";
import type { AreaKind, FloorPlan, MapArea, Place } from "./types";

// Every AreaKind, once. `satisfies` makes TypeScript reject this list if it
// drifts from the type, and checkFloorPlan() rejects JSON that drifts from it.
const AREA_KINDS = {
  hall: true, stage: true, room: true, lobby: true,
  balcony: true, outside: true, hotel: true, corridor: true,
} satisfies Record<AreaKind, true>;

const isNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isText = (s: unknown): s is string => typeof s === "string" && s.length > 0;

/** Checks the JSON's shape while the site builds, so a change to the map
 *  script that breaks the type fails loudly instead of slipping through. */
function checkFloorPlan(json: unknown): FloorPlan {
  const fail = (why: string): never => {
    throw new Error(`data/floor-plan.json: ${why}. Re-run scripts/build_floor_plan.py.`);
  };
  const plan = json as Partial<FloorPlan>;
  if (plan.units !== "feet") fail(`units should be "feet", not ${JSON.stringify(plan.units)}`);
  const frame = plan.frame;
  if (!frame || !isNumber(frame.width) || !isNumber(frame.length)) fail("frame needs a width and length");
  const points = plan.controlPoints ?? [];
  if (points.length < 3 || !points.every((p) => [p.lat, p.lng, p.x, p.y].every(isNumber))) {
    fail("needs three control points, each with lat, lng, x and y");
  }
  const levels = plan.levels ?? fail("missing levels");
  for (const [n, level] of Object.entries(levels)) {
    if (!isText(level.title) || !isText(level.svg)) fail(`level ${n} needs a title and svg path`);
  }
  const areas = plan.areas ?? fail("missing areas");
  for (const [id, area] of Object.entries(areas as Record<string, Partial<MapArea>>)) {
    if (!isText(area.label)) fail(`area ${id} needs a label`);
    if (!(String(area.kind) in AREA_KINDS)) fail(`area ${id} has unknown kind ${JSON.stringify(area.kind)}`);
    if (!Number.isInteger(area.level) || !(String(area.level) in levels)) {
      fail(`area ${id} is on level ${JSON.stringify(area.level)}, which the map doesn't have`);
    }
    const c = area.center;
    if (!Array.isArray(c) || c.length !== 2 || !c.every(isNumber)) fail(`area ${id} needs an [x, y] center`);
    if (typeof area.approximate !== "boolean") fail(`area ${id} needs approximate: true or false`);
  }
  return plan as FloorPlan;
}

export const floorPlan = checkFloorPlan(planJson);

/** Latitude/longitude ↔ plan feet, fitted through the building's corners. */
export const planTransform = floorPlanTransform(floorPlan.controlPoints);

export { areaName } from "./area-name";

/** Hotels and outdoor places sit on the Level 1 drawing as small insets, not
 *  where they really are, and have no floor of their own. */
export const isInset = (kind: AreaKind) => kind === "hotel" || kind === "outside";

/** Places you can say you're at: everything but corridors. */
export const isPickable = (kind: AreaKind) => kind !== "corridor";

// Where the insets really are (OpenStreetMap via Nominatim), so distances to
// and from them are real-world ones. checkInsets() keeps this list complete.
const INSET_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "avenida-plaza": { lat: 29.751793, lng: -95.358114 },
  "discovery-green": { lat: 29.752941, lng: -95.359606 },
  "the-grove": { lat: 29.752661, lng: -95.360185 },
  hilton: { lat: 29.751555, lng: -95.36066 },
  marriott: { lat: 29.754374, lng: -95.357634 },
};
for (const [id, area] of Object.entries(floorPlan.areas)) {
  if (isInset(area.kind) && !INSET_LOCATIONS[id]) {
    throw new Error(`src/lib/floor-plan.ts: add ${id} (an inset) to INSET_LOCATIONS.`);
  }
}

/** A place's real latitude/longitude and indoor level (null for insets). */
export function areaPlace(id: string): Place | null {
  const area = floorPlan.areas[id];
  if (!area) return null;
  if (isInset(area.kind)) return { ...INSET_LOCATIONS[id]!, level: null };
  return { ...planTransform.toLatLng(area.center[0], area.center[1]), level: area.level };
}
