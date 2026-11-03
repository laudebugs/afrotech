# 034 — Merge event pages into events

**Status:** done · **Plan:** [Plan 0008](../plans/0008-event-pages-and-maps-apps.md) · **Depends on:** 033

## Goal

Fill empty fields from the event pages, list disagreements for review, and run it in the refresh Action.

## Done when

- [x] `build_events.py` fills empty address, end, description and price, and credits the page
- [x] Disagreements listed in `schedule/side-events.md`
- [x] The refresh Action reads the pages before the build (via `update_side_events.py`)

## Notes

Built on November 3:

- **Merge:** `build_events.apply_event_pages` fills an empty address, venue,
  start, end, price or description, and adds "event page" to that event's
  `sources`.
  - It fills only from a page about the same day.
  - It fills an end only when the page's start time matches the list's.
  - It skips ends more than 24 hours after the start.
  - The CSV keeps the lists' own values.
- **Review table:** "Event pages that disagree" at the end of
  `schedule/side-events.md` lists different days, different start times and
  cancellations.
- **Changed from the plan:** `update_side_events.py` calls
  `enrich_events.py` itself, so the refresh Action needs no workflow change.
  This session can't push workflow files anyway. Geocoding already reads
  the built events, so filled addresses get map pins.
- **Credit:** `docs/sources.md` and the site footer now mention each event's
  own page.
- **Tests:** `tests/test_event_pages_merge.py`, 10 cases.
- **Not yet seen with real data:** the first Action run after this merges
  will write `data/event-pages.json`. Its log line ("event pages: … with an
  event block") shows how many pages the sites let a script read.
