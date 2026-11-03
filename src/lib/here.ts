// Where you are, for "Near me". Two sources:
// - GPS, only after you tap "Use my location". Kept in memory, never saved or
//   sent anywhere.
// - A room you pick ("I'm at…"). Saved on this device for 15 minutes, because
//   indoors it beats GPS, which can't tell rooms apart.
// Changes are announced with a "here-change" event on document.

export type Here =
  | { source: "gps"; lat: number; lng: number; accuracy: number }
  | { source: "picked"; areaId: string; until: number };

const KEY = "afrotech:here";
export const PICK_MINUTES = 15;

let gps: Extract<Here, { source: "gps" }> | null = null;
let watchId: number | null = null;

function announce() {
  document.dispatchEvent(new CustomEvent("here-change", { detail: currentHere() }));
}

function readPicked(): Extract<Here, { source: "picked" }> | null {
  try {
    const raw = localStorage.getItem(KEY);
    const pick = raw ? (JSON.parse(raw) as { areaId?: string; until?: number }) : null;
    if (pick?.areaId && typeof pick.until === "number" && pick.until > Date.now()) {
      return { source: "picked", areaId: pick.areaId, until: pick.until };
    }
  } catch {
    // Storage blocked: picks last for this page only (see memoryPick).
  }
  return memoryPick && memoryPick.until > Date.now() ? memoryPick : null;
}
let memoryPick: Extract<Here, { source: "picked" }> | null = null;

/** The picked room while it lasts, else the latest GPS fix, else nothing. */
export function currentHere(): Here | null {
  return readPicked() ?? gps;
}

/** "I'm at…": this room for the next 15 minutes. */
export function pickArea(areaId: string): void {
  const pick = { source: "picked" as const, areaId, until: Date.now() + PICK_MINUTES * 60_000 };
  memoryPick = pick;
  try {
    localStorage.setItem(KEY, JSON.stringify({ areaId, until: pick.until }));
  } catch {}
  announce();
}

export function clearPick(): void {
  memoryPick = null;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  announce();
}

/**
 * Starts following the device's position. Resolves "ok", or a reason the user
 * can read: unsupported, denied, or unavailable.
 */
export function startGps(): Promise<"ok" | string> {
  if (!("geolocation" in navigator)) return Promise.resolve("This browser can't share its location.");
  return new Promise((resolve) => {
    let first = true;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        gps = { source: "gps", lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        announce();
        if (first) resolve("ok");
        first = false;
      },
      (err) => {
        if (first) {
          resolve(
            err.code === err.PERMISSION_DENIED
              ? "Location is turned off for this site. Pick your room instead, or allow location in your browser settings."
              : "Couldn't get a location fix. Pick your room instead.",
          );
        }
        first = false;
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );
  });
}

export function stopGps(): void {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  gps = null;
  announce();
}

export const gpsOn = () => watchId !== null;
