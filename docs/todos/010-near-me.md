# 010 — Near me (geolocation + "I'm at…")

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 008, 009

## Goal

Show what's live or starting soon, closest first.

## Done when

- [x] Opt-in location button; position never leaves the device
- [x] Affine transform puts you on the floor plan, with accuracy circle
- [x] "I'm at…" room picker overrides GPS for 15 minutes
- [x] Nearby list: floor-plan distance inside the GRB, haversine for side events

## Notes

Built on November 3:

- **Page:** `/near/` lists what's live or starts within the hour, closest
  first. The Now page links to it.
- **Location:** "Use my location" starts `watchPosition` only on tap. The
  fix stays in memory and is never saved or sent. Denied or failed fixes say
  so and point to the room picker.
- **Room picker:** "I'm at…" lists rooms, halls, lobbies and the nearby
  hotels by level. A pick is saved on this device for 15 minutes and beats
  GPS while it lasts. Both `/near/` and the floor plan have the controls.
- **Floor plan:** `src/lib/geo.ts` fits an affine transform through three
  OSM corners of the GRB. The unused fourth corner lands within a foot of
  the drawing's corner. GPS draws a dot and accuracy circle on every level,
  since GPS can't tell floors apart; a pick draws one dot on its level and
  jumps there. Outside the drawing, a note replaces the dot.
- **Distance:** rooms become latitude/longitude through the same transform,
  so rooms and side events share one scale (haversine). A change of level
  adds 30 m. Events with no known spot (expo areas, lounges, TBA) go last,
  marked "distance unknown".

