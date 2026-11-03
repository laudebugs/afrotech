// Geometry for "Near me": placing a GPS fix on the floor plan, and distances.
// Pure functions, used at build time and in the browser.

export type LatLng = { lat: number; lng: number };
export type ControlPoint = LatLng & { x: number; y: number };

export const FEET_PER_METRE = 3.28084;

/** Solves a 3×3 linear system by Cramer's rule. */
function solve3(m: number[][], v: number[]): [number, number, number] {
  const det = (a: number[][]) =>
    a[0]![0]! * (a[1]![1]! * a[2]![2]! - a[1]![2]! * a[2]![1]!) -
    a[0]![1]! * (a[1]![0]! * a[2]![2]! - a[1]![2]! * a[2]![0]!) +
    a[0]![2]! * (a[1]![0]! * a[2]![1]! - a[1]![1]! * a[2]![0]!);
  const d = det(m);
  if (Math.abs(d) < 1e-18) throw new Error("Control points are in a line; pick three that form a triangle.");
  const col = (i: number) => m.map((row, r) => row.map((x, c) => (c === i ? v[r]! : x)));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}

/**
 * An affine map between latitude/longitude and floor-plan feet, fitted
 * exactly through three control points (the building's corners). Over a
 * building-sized area the earth is flat enough for this to be exact in
 * practice.
 */
export function floorPlanTransform(points: ControlPoint[]) {
  const [p, q, r] = points;
  if (!p || !q || !r) throw new Error("Need three control points.");
  const rows = [p, q, r].map((c) => [c.lng, c.lat, 1]);
  const [ax, bx, cx] = solve3(rows, [p.x, q.x, r.x]);
  const [ay, by, cy] = solve3(rows, [p.y, q.y, r.y]);
  // Inverse: solve the 2×2 linear part, then the offset.
  const det = ax * by - bx * ay;
  return {
    toMap({ lat, lng }: LatLng): { x: number; y: number } {
      return { x: ax * lng + bx * lat + cx, y: ay * lng + by * lat + cy };
    },
    toLatLng(x: number, y: number): LatLng {
      const dx = x - cx;
      const dy = y - cy;
      return { lng: (by * dx - bx * dy) / det, lat: (-ay * dx + ax * dy) / det };
    },
  };
}

/** Great-circle distance in metres. */
export function haversineMetres(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "300 ft" up to a tenth of a mile, then "1.2 mi". */
export function formatDistance(metres: number): string {
  const feet = metres * FEET_PER_METRE;
  if (feet < 528) return `${Math.max(50, Math.round(feet / 50) * 50)} ft`;
  return `${(feet / 5280).toFixed(feet < 52800 ? 1 : 0)} mi`;
}
