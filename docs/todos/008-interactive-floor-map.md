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
  `scripts/build_floor_plan.py`) with a level switcher. Each level button
  shows how many sessions are live on that level.
- **Pan and zoom:** `@panzoom/panzoom` handles drag and pinch on the map, and
  ctrl/⌘ + wheel or trackpad pinch on desktop. A plain wheel scrolls the page.
  Zoom buttons sit beside the map. On phones the map is 55% of the screen
  high, so you can swipe the page above and below it. There's no edge clamping
  (`contain`), so rooms near an edge can be centred; ⤢ fits the level again.
- **States:** each room shows its state for today:
  - Rooms with nothing today fade.
  - Rooms with sessions today get a dark outline.
  - Live rooms get a green outline and a pulsing "● 2 live" badge, so colour
    isn't the only signal; the pulse stops under reduced motion.
  - Rooms with your picks get a plum outline.
  - The selected room keeps its outline and gains a plum wash, which stays
    after its sheet closes.
  - Approximate shapes are dashed.

  Small labels hide until you zoom in. Spoken labels read "Hall E · Main Stage,
  1 live now, 7 today". States refresh at the start of each minute, and
  `?now=` previews any moment.
- **Room sheet:** a tap (not a drag) or Enter opens a sheet listing the room's
  sessions today, or "Next sessions: Mon, Nov 2" on a quiet day. Each session
  has its time, a link and a star. Rooms read "Meeting Room 320", and notes
  explain approximate spots ("HealthStack Seminar Room: the exact room isn't
  published"). Focus returns to the room when the sheet closes.
- **Today list:** below the map, it lists every room and place with sessions
  today, live ones first. Rooms are buttons that centre the map and open the
  sheet; expo areas and lounges, which have no map spot, list their sessions as
  links under their note. This is the keyboard and screen-reader path. The list
  is rebuilt only when its content changes, so a focused button survives a
  refresh. Tabbing to a room that's off screen pans it into view.
- **Show on map:** event pages for places on the map link to
  `/map/?area=<id>`, which switches level, centres the room at up to 3× and
  opens its sheet. Events without a map spot show their venue note instead.
- **Shared helpers:** `previewNow()`, `eventEndMs()` and `everyMinute()` live in
  `src/lib/time.ts`, and the Now page and the star script use them too.
- **Gotcha:** Panzoom queues a `setTimeout` at setup that pans to its start
  position. Code that centres a room on load must run after it (another
  `setTimeout`), or the pan is lost about half the time.
