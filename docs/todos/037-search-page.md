# 037 — Week-wide search page

**Status:** done · **Plan:** [Plan 0009](../plans/0009-search-and-filters.md) · **Depends on:** 036

## Goal

Add `/schedule/search/` with results by day, and a search box on each day's Schedule page.

## Done when

- [x] Box with keyboard up, results grouped by day, stars, live count
- [x] Query and filters in the URL; recent searches on the device
- [x] Search box at the top of each day's Schedule page opens it

## Notes

Built on November 4:

- **Page:** `/schedule/search/` loads `/search-index.json` and matches in
  the browser.
  - Results are grouped by day, in the order their best match appears, so
    upcoming matches lead and ended ones follow.
  - Each result has a star, and results show 60 at a time with "Show more".
- **Address:** the address holds `?q=`, so a shared link opens the same
  search.
- **Recent searches:** up to 8, kept on the device. A search is remembered
  after Enter, or after a 1.5-second pause that shows results.
- **Day pages:** each day's text box became a "Search the whole week" link.
  Its day-only text filter is gone, since the week search covers it; the
  chips and the track picker stay until todo 038. `searchText` in
  `src/lib/schedule.ts` was removed with it.
- **Tested** in a 390 px browser:
  - "enterpreneur" finds 18 events and "ai health" finds 22 across 4 days.
  - A shared `?q=` link works, and a star saves to Saved.
  - Recent searches and "Show more" work.
  - The day page's other filters still work.
