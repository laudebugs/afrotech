# 013 — Service worker: precache, per-request rules and offline page

**Status:** todo · **Plan:** [Plan 0004](../plans/0004-offline-support.md) · **Depends on:** 004

## Goal

Make the site open and work with no connection, as plan 0004 describes.

## Done when

- [ ] `/sw.js` built by Astro, stamped with a build id and the precache list
- [ ] Precache Now, `/schedule/` and all seven day pages, `/plan/`, `/notes/`, the 404 page and `/_astro/*`
- [ ] Pages network-first with a 3-second timeout, then the saved copy, then an offline page
- [ ] `/_astro/*` cache-first; `/event/*` and `.ics` stale-while-revalidate; `/api/*` never cached
- [ ] Starring an event saves its page and `.ics` file
- [ ] New builds replace the old cache; a kill-switch worker is documented
- [ ] Playwright: offline Now, day page, My plan, starred event page and plan export

## Notes

Precaches all seven days, the plan's recommended default.
