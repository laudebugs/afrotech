# 009 — Geocode side events + city map

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002, 003

## Goal

Put side events on a map of Houston.

## Done when

- [ ] `scripts/geocode.py` geocodes addresses via Nominatim (1 req/s), caches to `data/geocode.json`
- [ ] `/map/city` with MapLibre GL + OpenFreeMap tiles, loaded only on this page
- [ ] Pins clustered; tap → event sheet; filter by day and "in my plan"
- [ ] Events without an address listed below the map
