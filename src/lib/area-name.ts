/** "320" on the map; "Meeting Room 320" in words. Kept apart from
 *  floor-plan.ts so browser scripts can use it without the plan's JSON. */
export const areaName = (area: { label: string }) =>
  /^\d+$/.test(area.label) ? `Meeting Room ${area.label}` : area.label;
