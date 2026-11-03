// The traced convention center map: areas, levels and the building's
// real-world corners. Written by scripts/build_floor_plan.py.
import planJson from "../../data/floor-plan.json";
import type { FloorPlan } from "./types";

export const floorPlan = planJson as FloorPlan;
