# 002 — Normalise event data to one schema

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** —

## Goal

Turn `data/sessions.json` and `data/side-events.csv` into the `Event` schema from the plan, so the site reads one shape.

## Done when

- [x] `scripts/build_events.py` writes `data/events/official.json` and `data/events/side.json`
- [x] Stable ids (official: source uuid; side: hash of date + normalised title)
- [x] ISO start/end with `-06:00`; unknown times kept as `null` with a `timeLabel`
- [x] `data/venues.json` seeded with every location string → location key
- [x] TypeScript type `Event` in `src/lib/types.ts` matches the JSON
- [x] Update scripts call it at the end, so one command refreshes everything

## Notes

Keep the existing markdown outputs in `schedule/` — they're useful on GitHub.

Four changes from the plan's type:

1. **Name.** The type is `ScheduleEvent`, because `Event` clashes with the
   browser's built-in `Event` type.
2. **Nulls.** Missing values are `null` rather than absent, so every event has
   the same keys.
3. **Two new fields.** `timeLabel` holds "TBA" when a start time is unknown,
   and `ticketLevels` lists the passes that admit you to an official session.
4. **Venue kinds.** `data/venues.json` gives every place a kind: `grb`,
   `marriott`, `outdoor`, `offsite` or `unplaced`.

`data/venues.json` is partly hand-maintained. The script adds new places and
never removes fields such as `areaId` or `lat`, which todos 007 and 009 add.

Building the events exposed three events that afrotech.guide lists twice, so
`update_side_events.py` now collapses exact repeats within each source.
