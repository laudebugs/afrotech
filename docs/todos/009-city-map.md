# 009 — Geocode side events + city map

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002, 003

## Goal

Put side events on a map of Houston.

## Done when

- [x] `scripts/geocode.py` geocodes addresses via Nominatim (1 req/s), caches to `data/geocode.json`
- [x] `/map/city` with MapLibre GL + OpenFreeMap tiles, loaded only on this page
- [x] Pins clustered; tap → event sheet; filter by day and "in my plan"
- [x] Events without an address listed below the map

## Notes

Built on November 3:

- **Geocoding:** `scripts/geocode.py` looks up each new address on Nominatim,
  one per second with an identifying User-Agent, inside a Houston box, and
  caches results in `data/geocode.json`. 105 of 122 addresses are placed.
  - **Suites:** suite and unit numbers ("Ste 200", "#400") are stripped first,
    because Nominatim can't match them.
  - **Rejected:** placeholders ("Shared on approval", "TBA"), and matches only
    to a city, county or whole street, which can be miles off. Those events
    are listed under the map instead of getting a misleading pin.
  - **Retries:** misses carry a `rules` version, so they're retried when the
    matching rules change.
- **Refresh:** the scheduled workflow runs the geocoder after fetching side
  events, so new addresses get pins without a manual run.
- **Page:** `/map/city/` loads MapLibre GL 6 only on this page (about 1 MB
  before compression) with OpenFreeMap tiles: Positron in light mode, Dark in
  dark mode.
  - **Gestures:** one finger scrolls the page and two fingers move the map
    (`cooperativeGestures`).
  - **Pins:** one per venue, clustered when zoomed out. Venues with your picks
    are filled plum; others are plum outlines, so the difference isn't colour
    alone.
  - **Taps:** tapping a cluster zooms in; tapping a pin opens a sheet with the
    venue, address, Directions and its events with stars.
  - **Filters:** day chips (today by default during the week, or All week) and
    My plan, kept in the URL.
  - **Not on the map:** a list under the map shows events without a usable
    address, with the same filters.
- **Map switch:** a Convention center / City switch sits in both map pages'
  headers.
- **Gotcha:** MapLibre 6 runs a module worker. It's bundled with
  `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and `setWorkerUrl()`,
  and Vite's `worker.format` is `es` (`astro.config.mjs`); otherwise the map
  fails with "Worker failed to load".
