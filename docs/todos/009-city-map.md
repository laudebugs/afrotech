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
  caches results in `data/geocode.json`. 102 of 122 addresses are placed.
  - **Suites:** suite and unit numbers ("Ste 200", "#400") are stripped first,
    because Nominatim can't match them.
  - **Rejected:** placeholders ("Shared on approval", "Address in info section
    77003"); matches only to a city, county or whole street, which can be
    miles off; and matches whose postcode differs from the address's. The
    postcode check stopped "2301 Main St, 77002" landing in South Houston.
    Rejected events are listed under the map instead of getting a misleading
    pin.
  - **Re-checks:** each result records `MATCH_RULES_VERSION`; bumping it
    re-checks every cached address.
  - **Failures:** the script stops on rate limiting (403/429) or three
    failures in a row, keeps what it found, and exits non-zero, so the refresh
    workflow reports it.
- **Refresh:** the scheduled workflow runs the geocoder after fetching side
  events, so new addresses get pins without a manual run.
- **Page:** `/map/city/` loads MapLibre GL 6 only on this page (about 1 MB
  before compression) with OpenFreeMap tiles: Positron in light mode, Dark in
  dark mode.
  - **Theme:** the map redraws when the theme toggle or the device switches.
  - **Gestures and credit:** one finger scrolls the page and two fingers move
    the map (`cooperativeGestures`). The OpenStreetMap credit is shown in full.
  - **Pins:** one per venue, with a 44 px tap target, clustered when zoomed
    out. Cluster numbers count events, like the status line. Venues with your
    picks are filled plum; others are plum rings, so the difference isn't
    colour alone.
  - **Taps:** tapping a cluster zooms in; tapping a pin opens a sheet with the
    venue, address, Directions and its events with stars.
  - **Filters:** day chips (today by default during the week, or All week) and
    My plan, kept in the URL. An unknown `?day=` falls back to the default.
- **Lists below the map:**
  - **Places on the map:** the same places as buttons, which centre the map and
    open the sheet. This is the keyboard and screen-reader path.
  - **Not on the map:** events without a usable address, with the same
    filters.
- **Map switch:** a Convention center / City switch sits in both map pages'
  headers.
- **Credits:** the footer on every page credits OpenStreetMap, OpenFreeMap,
  Nominatim and the GRB floor plans.
- **Shared code:** both map pages build their event lists with
  `src/scripts/event-rows.ts` and `src/styles/event-rows.css`.
- **Gotcha:** MapLibre 6 runs a module worker. It's bundled with
  `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and `setWorkerUrl()`,
  and Vite's `worker.format` is `es` (`astro.config.mjs`); otherwise the map
  fails with "Worker failed to load".
