// Where you are, for "Near me". Two sources:
// - GPS, only after you tap "Use my location". Kept in memory, never saved or
//   sent anywhere.
// - A room you pick ("I'm at…"). Saved on this device for 15 minutes, because
//   indoors it beats GPS, which can't tell rooms apart.
// Changes are announced with a "here-change" event on document.

import type { Place } from "./types";

export type Here =
  | { source: "gps"; lat: number; lng: number; accuracy: number }
  | { source: "picked"; areaId: string; until: number };

const KEY = "afrotech:here";
export const PICK_MINUTES = 15;

let gps: Extract<Here, { source: "gps" }> | null = null;
let watchId: number | null = null;

let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function announce() {
  // When a pick runs out, announce again so pages drop it.
  clearTimeout(expiryTimer);
  const pick = readPicked();
  if (pick) expiryTimer = setTimeout(announce, pick.until - Date.now() + 500);
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

/** "I'm at…": this room for the next PICK_MINUTES. */
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

export type GpsResult = { ok: true } | { ok: false; reason: string };
let settleStart: ((r: GpsResult) => void) | null = null;

/** Starts following the device's position. Resolves once the first fix
 *  arrives, or with a reason the user can read if there won't be one. */
export function startGps(): Promise<GpsResult> {
  if (!("geolocation" in navigator)) return Promise.resolve({ ok: false, reason: "This browser can't share its location." });
  return new Promise((resolve) => {
    settleStart = (r) => {
      settleStart = null;
      resolve(r);
    };
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        gps = { source: "gps", lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        settleStart?.({ ok: true });
        announce();
      },
      (err) => {
        // Before the first fix, an error ends the attempt; later ones (a lost
        // signal) keep the last fix and the watch.
        if (!settleStart) return;
        const reason =
          err.code === err.PERMISSION_DENIED
            ? "Location is turned off for this site. Pick your room instead, or allow location in your browser settings."
            : "Couldn't get a location fix. Pick your room instead.";
        const settle = settleStart;
        settleStart = null;
        stopGps();
        settle({ ok: false, reason });
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );
  });
}

export function stopGps(): void {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  gps = null;
  settleStart?.({ ok: false, reason: "" });
  announce();
}

export const gpsOn = () => watchId !== null;

/** Where you are as a point on the ground, or null. */
export function herePlace(placeOf: (areaId: string) => Place | null | undefined): Place | null {
  const here = currentHere();
  if (here?.source === "picked") return placeOf(here.areaId) ?? null;
  if (here?.source === "gps") return { lat: here.lat, lng: here.lng, level: null };
  return null;
}

// A pick saved on an earlier page still needs its expiry announced here.
if (typeof document !== "undefined" && readPicked()) queueMicrotask(announce);
