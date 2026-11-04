# 036 — Search index and matching

**Status:** done · **Plan:** [Plan 0009](../plans/0009-search-and-filters.md) · **Depends on:** none

## Goal

Build `/search-index.json` and the MiniSearch matching, with tests.

## Done when

- [x] `/search-index.json` built from events and speakers (compact)
- [x] `src/lib/search.ts`: fields, weights, prefix and fuzzy matching, accent folding
- [x] Tests for ranking, typos and accents

## Notes

Built on November 4:

- **Index:** `src/lib/search-index.ts` builds `/search-index.json` from every
  event and speaker. It's 312 KB, or 87 KB as sent. Descriptions are cut to
  300 characters, enough to find an event by its subject.
- **Where:** each event gets a "where" value. Official and on-site events are
  "grb"; side events within 1.5 km of the convention center's middle are
  "near"; the rest are "city". The middle is taken from the floor plan's
  corners. 46 side events have no placed address and get null, so the
  "Where" filter can't place them.
- **Matching:** `src/lib/search.ts` uses MiniSearch 7.2.0.
  - Word starts match, and every word must match.
  - Words of 5 or more letters forgive a typo.
  - Case and accents are ignored.
  - Title matches rank first, then speakers and hosts, then the rest; ended
    events go last, then by time.
- **Tests:** `tests/search.test.ts` has 9 tests.
