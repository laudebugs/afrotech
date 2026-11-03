# 003 — Design tokens, base layout and tab bar

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 001

## Goal

Implement the [design language](../design/design-language.md) as CSS tokens and a base layout every page uses.

## Done when

- [x] `src/styles/tokens.css` with Plum and Plum Night tokens, system and manual theme
- [x] `BaseLayout.astro`: head, skip link, bottom tab bar (mobile), nav rail (≥1024 px)
- [x] Timeline rail, now marker, event card with progress bar, time header, chip, star and bottom sheet components (static, no data yet)
- [x] No horizontal scroll at 320 px; focus rings visible; 44 px touch targets
- [x] A `/design` page showing every component in both themes

## Notes

The components live in `src/components/`: `AppNav`, `Chip`, `Star`,
`Timeline`, `TimelineRow`, `EventCard` (with its progress bar and clash line),
`NowMarker`, `TimeHeader`, `BottomSheet`, `ThemeToggle` and `Icon`. Houston-time
formatting lives in `src/lib/time.ts`, and saved preferences in
`src/lib/prefs.ts`.

Two details changed from the design language. The rail shows times without
AM/PM ("10:45"), because "10:45 AM" wrapped in the 48 px column and the hour
headers already say AM or PM. The theme button cycles through device setting,
light and dark, and a small script in the page head applies a saved choice
before the first paint.

Checked at 320, 390 and 1280 px wide in both themes: no horizontal scroll.
