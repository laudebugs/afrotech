# 008 — Interactive floor map component

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 003, 007

## Goal

Make the floor plan useful: see what's happening where.

## Done when

- [x] `/map` with level switcher; pan/zoom with `@panzoom/panzoom` + buttons
- [x] Area states: has events today, live now, in my plan, selected
- [x] Tap/Enter on an area → sheet with that area's sessions
- [x] "Show on map" from an event zooms to its area
- [x] List fallback of rooms with events now; keyboard and screen-reader usable

## Notes

Built on November 3:

- **Page:** `/map` inlines the three level SVGs (built by
  `scripts/build_floor_plan.py`) with a level switcher. Each level button shows
  how many sessions are live on that level.
- **Pan and zoom:** `@panzoom/panzoom` handles pinch, drag and the scroll
  wheel, with zoom buttons beside the map. There's no edge clamping
  (`contain`), so rooms near an edge can still be centred; ⤢ fits the level
  again.
- **States:** each room shows its state for today:
  - Rooms with nothing today fade.
  - Live rooms get a green outline and a "● 2 live" badge, so colour isn't the
    only signal.
  - Rooms with your picks get a plum outline.
  - The selected room gets a thick plum outline.
  - Approximate shapes are dashed.

  Spoken labels read "Hall E · Main Stage, 1 live now, 7 today". States
  refresh every minute, and `?now=` previews any moment.
- **Room sheet:** a tap (not a drag) or Enter opens a sheet listing the room's
  sessions today, or on its next day with sessions. Each has its time, a link
  and a star. Rooms read "Meeting Room 320", and notes explain approximate
  spots ("HealthStack Seminar Room: the exact room isn't published").
- **Live now list:** below the map, it lists every room with something on, as
  buttons that centre the map on the room and open its sheet. It also covers
  the expo areas and lounges, which have no map spot, with their note. This is
  the keyboard and screen-reader path.
- **Show on map:** event pages for places on the map link to
  `/map/?area=<id>`, which switches level, centres the room at up to 3× and
  opens its sheet. Events without a map spot show their venue note instead.
- **Gotcha:** Panzoom queues a `setTimeout` at setup that pans to its start
  position. Code that centres a room on load must run after it (another
  `setTimeout`), or the pan is lost about half the time.
