# 032 — Directions open a maps app

**Status:** done · **Plan:** [Plan 0008](../plans/0008-event-pages-and-maps-apps.md) · **Depends on:** none

## Goal

Make Directions open a maps app on phones, asking which one on iPhone.

## Done when

- [x] iPhone and iPad: a sheet offers Apple Maps, Google Maps and Waze, last choice first
- [x] Android: a `geo:` link opens the system chooser
- [x] Computer: Google Maps directions in a new tab; works without scripts
- [x] Event pages, the schedule's sheet and city-map pins all use it

## Notes

Built on November 3:

- **Code:** `src/lib/directions.ts` builds each app's link, and
  `src/scripts/directions.ts` takes over taps on links marked
  `data-directions`.
- **Changed from the plan:** links send the street address, not our
  coordinates, because maps apps place an address more accurately than the
  free geocoder behind the city map.
- **Tested** with Playwright's iPhone 13 and Pixel 7 profiles and a desktop:
  - iPhone shows the sheet, moves the last choice to the top, and Escape
    closes it
  - Android sends the tap to `geo:`
  - a computer opens Google Maps directions in a new tab
  - city-map pins use the same links
  Real phones still need a check that each app opens.
