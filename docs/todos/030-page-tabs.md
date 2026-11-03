# 030 — Page tabs, and the map switch uses them

**Status:** done · **Plan:** [Plan 0007](../plans/0007-saved-tab.md) · **Depends on:** none

## Goal

Draw section tabs as tabs (text over an underline), not buttons, starting with the map.

## Done when

- [x] `src/components/PageTabs.astro`: links with `aria-current`, the current one underlined in the accent colour
- [x] The map's Convention center / City switch uses it, under the heading on both map pages

## Notes

Built on November 3. Both map pages now use the heading "Map", since the tabs
name the view; the city page was "Side events". Checked at 390 px in light and
dark.
