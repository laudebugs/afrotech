# 023 — Data stamp and offline banner

**Status:** done · **Plan:** [Plan 0004](../plans/0004-offline-support.md) · **Depends on:** 013

## Goal

Always show how fresh the schedule is, and say so plainly when offline.

## Done when

- [x] Build stamps the data time; footer reads "Schedule updated Wed, Nov 4, 2:30 PM"
- [x] Offline banner: "Offline. Showing the schedule from …", hidden when back online
- [x] Banner uses design tokens and doesn't cover the tab bar

Built on November 3:

- **Stamp:** the time of the commit being built, set in `astro.config.mjs` and
  read through `src/lib/build-info.ts`. Data refreshes are commits, so this is
  when the schedule last changed. Using the commit, not the build time, keeps
  rebuilds identical, so phones don't update for nothing.
- **Footer:** "Last updated Tue, Nov 3, 1:04 PM." on every page with sources. It says
  "Last updated", not "Schedule updated", because code changes are commits too.
- **Offline banner:** "Offline. Showing saved pages from …", above the tab bar,
  shown and hidden on the browser's `offline` and `online` events.
