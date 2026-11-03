// The traced convention center map: areas, levels and the building's
// real-world corners. Written by scripts/build_floor_plan.py.
import planJson from "../../data/floor-plan.json";
import type { AreaKind, FloorPlan, MapArea, Venue } from "./types";

const AREA_KINDS: ReadonlySet<string> = new Set<AreaKind>([
  "hall", "stage", "room", "lobby", "balcony", "outside", "hotel", "corridor",
]);

/** Checks the JSON's shape while the site builds, so a change to the map
 *  script that breaks the type fails loudly instead of slipping through a cast. */
function checkFloorPlan(json: unknown): FloorPlan {
  const fail = (why: string): never => {
    throw new Error(`data/floor-plan.json: ${why}. Re-run scripts/build_floor_plan.py.`);
  };
  const plan = json as Partial<FloorPlan>;
  if (plan.units !== "feet") fail(`units should be "feet", not ${JSON.stringify(plan.units)}`);
  if (!Array.isArray(plan.controlPoints) || plan.controlPoints.length < 3) fail("needs three control points");
  if (!plan.levels || !plan.areas) fail("missing levels or areas");
  for (const [id, area] of Object.entries(plan.areas as Record<string, Partial<MapArea>>)) {
    if (!AREA_KINDS.has(area.kind ?? "")) fail(`area ${id} has unknown kind ${JSON.stringify(area.kind)}`);
    if (!(String(area.level) in plan.levels!)) fail(`area ${id} is on a level the map doesn't have`);
    const c = area.center;
    if (!Array.isArray(c) || c.length !== 2 || !c.every(Number.isFinite)) fail(`area ${id} needs an [x, y] center`);
    if (typeof area.approximate !== "boolean") fail(`area ${id} needs approximate: true or false`);
  }
  return plan as FloorPlan;
}

export const floorPlan = checkFloorPlan(planJson);

/** The map area a venue sits in, if it has one. */
export const areaOf = (venue: Venue): MapArea | undefined =>
  venue.areaId ? floorPlan.areas[venue.areaId] : undefined;

/** The level a venue is on: its area's level, or the venue's own for places without one. */
export const levelOf = (venue: Venue): number | undefined => areaOf(venue)?.level ?? venue.level;
