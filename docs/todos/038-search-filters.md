# 038 — Shared filters

**Status:** done · **Plan:** [Plan 0009](../plans/0009-search-and-filters.md) · **Depends on:** 037

## Goal

Filter chips and a filter sheet, shared by the search page and each day's Schedule page.

## Done when

- [x] When, type, track, kind, cost and access, where, mine, picks
- [x] Chips show what's on; the sheet shows the result count
- [x] Day pages use the same component

## Notes

Built on November 4:

- **Rules:** `src/lib/filters.ts` holds the filter rules, their place in the
  address and the "which events pass" check. `tests/filters.test.ts` has 7
  tests.
- **Sorting rules:**
  - Time of day goes by start hour: morning 5 AM–noon, afternoon noon–5 PM,
    evening 5–9 PM, late night 9 PM–5 AM.
  - Official sessions count as "Needs a badge". Notes such as RSVP, invite,
    approval, members or waitlist count as "RSVP or invite"; the rest are
    "Open to all".
- **Component:** `src/components/Filters.astro` and
  `src/scripts/filters-ui.ts` draw a quick-chip row plus a sheet with every
  filter. The sheet's button counts matching events, and tapping a chip
  that's on turns it off.
- **Search page:** filters work with or without words, so "Tonight + Free"
  lists the week's free evening events.
- **Day pages:** these use the same component, with the When group reduced
  to "Now and next", since the day is fixed. Their old chips and track
  picker are gone, along with `isFree` row attributes. Rows carry the filter
  data from the search index.
- **Review fixes:**
  - "Tonight" includes starts after midnight, before 5 AM.
  - "Now and next" shows only on today's page.
  - Chip values split on their first "=" only.
- **Tested** in a 390 px browser on both pages, including the day links
  keeping filters, Clear all, and starting from a filtered address.
