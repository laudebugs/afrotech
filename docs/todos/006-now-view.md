# 006 — Now view

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 004

## Goal

Home page answering "what's on now and next?"

## Done when

- [x] Live events and events starting in the next 60 minutes, my picks first
- [x] Updates every minute without a reload
- [x] Day-aware: before/after the conference, show the next day's first events
- [x] Uses Houston time regardless of the device timezone

## Notes

- **Rendering:** the home page renders every timed event, and a script picks
  what to show each minute: events live now, then those starting within the
  hour, after the green now marker.
- **Live order:** your picks come first, then sessions, then all-day items
  such as Expo Hall Hours (3 hours or more), each by most recent start. Ordering
  by start time alone buried the sessions under a dozen all-day listings.
- **Quiet hours:** overnight, before the week and after it, the page shows the
  next six events with "Nothing on right now. Next up: …", or a closing note
  once everything is over.
- **Filters:** Everything, My plan and Side events chips, kept in `?show=`.
- **Preview a moment:** `?now=2026-11-04T11:00` shows any Houston time, which
  makes testing easy.
- **Fix to todo 004:** a global `[hidden] { display: none !important }` rule.
  Components that set `display` were overriding the browser's own hiding, so
  rows the filters hid could still show.
