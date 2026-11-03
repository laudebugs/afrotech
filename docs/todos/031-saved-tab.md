# 031 — The Saved tab: Plan and Notes

**Status:** done · **Plan:** [Plan 0007](../plans/0007-saved-tab.md) · **Depends on:** 030

## Goal

Rename My plan to Saved and give it Plan and Notes tabs, with the account panel on both.

## Done when

- [x] The tab bar says Saved; `/plan/` and `/notes/` both light it up
- [x] Both pages show the heading Saved and Plan / Notes tabs with counts
- [x] The account panel sits below the content on both pages

## Notes

Built on November 3:

- **Shared header:** `SavedHead.astro` draws the heading and the Plan and
  Notes tabs. `plan-ui.ts` already fills the plan count; `notes-ui.ts` now
  fills the notes count.
- **Highlighting:** the note editor and note view also light up Saved in
  the tab bar.
- **Wording:** links that sent people to "My plan" to sign in now say
  "Saved". Filters named "My plan" on the schedule, Now and the city map
  keep that name, since they show your plan.
- **Tested** at 390 px in light and dark: the bar label and badge, both
  tab counts, switching tabs and the account panel on each tab.
