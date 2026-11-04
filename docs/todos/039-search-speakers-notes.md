# 039 — Speakers and notes in search, offline

**Status:** done · **Plan:** [Plan 0009](../plans/0009-search-and-filters.md) · **Depends on:** 037

## Goal

Add speakers and your notes to the results, and make search work offline.

## Done when

- [x] Speakers in results, opening their profile
- [x] Your notes searched on the device only
- [x] Search page and index saved by the service worker

## Notes

Built on November 4:

- **Speakers:** they're matched from `/search-index.json` by name, title or
  company. They show above the events, 4 at first with "Show all N", and
  each opens its profile.
- **Your notes:** they're matched on the device by title and text, with
  Markdown and embedded photos removed first (`noteText`). Nothing is sent,
  and the results update when notes change in another tab or by sync.
- **Offline:** the service worker saves `/schedule/search/` and
  `/search-index.json` up front. The index is served from the cache and
  refreshed in the background.
- **Tested** in a 390 px browser. A speaker search found the profile, a note
  search found the note without its photo, and after going offline,
  `/schedule/search/?q=wealth` still found 44 events. Signed out, the page
  sent no API requests.
