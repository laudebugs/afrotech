# 005 — My plan: star, clashes, .ics export, share link

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 004

## Goal

Pick the events you want and see where they clash.

## Done when

- [x] Star toggles on rows and detail; stored in `localStorage` (`afrotech:plan`), safe when storage is blocked
- [x] `/plan` grouped by day, with clash warnings on overlapping events
- [x] Export the whole plan as one .ics
- [x] Share link encodes event ids; opening it offers "Add these to my plan"
- [x] Star count badge on the tab bar

## Notes

- **Storage:** `src/lib/plan.ts` keeps the ids under `afrotech:plan`; when
  storage is blocked the plan lives in memory for the page. Another tab's
  changes show up through the `storage` event.
- **Wiring:** `src/scripts/plan-ui.ts` runs on every page. It toggles stars by
  click delegation, syncs stars, cards, rows and the tab badge, announces
  changes to screen readers, and marks clashes between planned events on the
  page. Content added later, such as the schedule's bottom sheet, syncs
  through a MutationObserver.
- **Clashes:** they show on the day pages too, not only in My plan. An event
  without an end counts as an hour long, as in the calendar export. A day page
  only compares that day's events, so a clash across midnight shows on /plan
  but not on the day page.
- **Cleanup:** /plan drops stored ids of events the sources no longer list, so
  the tab badge matches the plan.
- **Day pages:** they gained a **My plan** filter chip (`?plan=1`).
- **/plan:** the page renders every event and CSS shows only the starred ones
  (53 KB compressed). Export merges each event's own `.ics` file into one
  calendar, so it needs a connection. Share links use `/plan/?add=id1,id2`.
