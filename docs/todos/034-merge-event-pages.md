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
  `enrich_events.py` itself, after writing the lists and building, then
  rebuilds with the page data. The refresh Action needs no workflow change,
  and a problem with the pages can't undo the side-event refresh.
  This session can't push workflow files anyway. Geocoding already reads
  the built events, so filled addresses get map pins.
- **Credit:** `docs/sources.md` and the site footer now mention each event's
  own page.
- **Review fixes:**
  - A page with a date but no time can't crash the build.
  - Reading pages gets 5 minutes, inside the job's 15.
  - Pages are read from the list just written, after the build passes.
  - Emails and phone numbers are removed from page descriptions.
  - A venue name fills only with an address, so hand-added map fields stay
    attached.
  - Links shared across several days are left alone.
  - A broken `data/event-pages.json` is ignored.
  - `npm test` now runs the Python tests too.
- **Tests:** 25 Python tests across `tests/test_enrich_events.py` and
  `tests/test_event_pages_merge.py`. A full `update_side_events.py` run here
  wrote the lists, failed to reach the 137 pages as expected, and rebuilt
  cleanly with no data change.
- **Not yet seen with real data:** the first Action run after this merges
  will write `data/event-pages.json`. Its log line ("event pages: … with an
  event block") shows how many pages the sites let a script read.
