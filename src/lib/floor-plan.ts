// The traced convention center map: areas, levels and the building's
// real-world corners. Written by scripts/build_floor_plan.py.
import planJson from "../../data/floor-plan.json";
import type { AreaKind, FloorPlan, MapArea } from "./types";

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
