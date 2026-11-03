# 003 — Design tokens, base layout and tab bar

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 001

## Goal

Implement the [design language](../design/design-language.md) as CSS tokens and a base layout every page uses.

## Done when

- [ ] `src/styles/tokens.css` with Plum and Plum Night tokens, system and manual theme
- [ ] `BaseLayout.astro`: head, skip link, bottom tab bar (mobile), nav rail (≥1024 px)
- [ ] Timeline rail, now marker, event card with progress bar, time header, chip, star and bottom sheet components (static, no data yet)
- [ ] No horizontal scroll at 320 px; focus rings visible; 44 px touch targets
- [ ] A `/design` page showing every component in both themes
