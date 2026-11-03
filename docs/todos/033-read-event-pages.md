# 033 — Read side-event pages

**Status:** done · **Plan:** [Plan 0008](../plans/0008-event-pages-and-maps-apps.md) · **Depends on:** none

## Goal

Read each side event's own page (JSON-LD `Event`) into `data/event-pages.json`.

## Done when

- [x] `scripts/enrich_events.py`: one fetch per link a day, standard library only
- [x] Parser tested on sample pages for posh.vip, Eventbrite and Luma

## Notes

Built on November 3:

- **Script:** `scripts/enrich_events.py` reads the 140 unique links in
  `data/side-events.csv`. For each page it keeps the schema.org Event block's
  title, start, end, venue, address, price, organiser, description and
  status (cancelled or postponed), with times converted to Houston time.
- **Skipped sites:** afrotechconference.com links are skipped, since those
  rows already come from AfroTech's own listing, and so are form builders.
- **Failures:** a page that fails keeps its last good result and is tried
  again a day later. If no page loads at all, the script writes nothing and
  still exits cleanly, so the refresh Action carries on.
- **Review fixes:**
  - Pages are fetched at most once a day, even after a failure.
  - Skipped sites are written once, so the file doesn't change every run.
  - An odd page or bad saved data can't stop the run.
  - A page's own event wins over lists of other events on it.
  - A date-only start is kept as `startDay`.
  - Tag-like text such as "<your laptop>" keeps its words.
  - Each page gets 20 seconds, and each run 15 minutes.
- **Tests:** `tests/test_enrich_events.py` runs on pages built to the shapes
  Eventbrite, Luma and posh.vip publish. They aren't saved copies, because
  this sandbox can't reach those sites.
- **Not yet run for real:** `data/event-pages.json` comes from the refresh
  Action, which todo 034 sets up. Some sites may refuse a script's user
  agent; that run will show which ones.
