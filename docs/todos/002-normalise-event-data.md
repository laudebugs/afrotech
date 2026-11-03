# 002 — Normalise event data to one schema

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** —

## Goal

Turn `data/sessions.json` and `data/side-events.csv` into the `Event` schema from the plan, so the site reads one shape.

## Done when

- [ ] `scripts/build_events.py` writes `data/events/official.json` and `data/events/side.json`
- [ ] Stable ids (official: source uuid; side: hash of date + normalised title)
- [ ] ISO start/end with `-06:00`; unknown times kept as `null` with a `timeLabel`
- [ ] `data/venues.json` seeded with every location string → location key
- [ ] TypeScript type `Event` in `src/lib/types.ts` matches the JSON
- [ ] Update scripts call it at the end, so one command refreshes everything

## Notes

Keep the existing markdown outputs in `schedule/` — they're useful on GitHub.
