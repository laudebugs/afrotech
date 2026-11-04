# 040 — Liquid Glass tab bar and page transitions

**Status:** done · **Plan:** [Plan 0010](../plans/0010-glass-navigation.md) · **Depends on:** none

## Goal

Make phone navigation look and feel like an iOS 26 app.

## Done when

- [x] Floating glass tab bar with a capsule behind the current tab, press feedback, and solid fallbacks
- [x] The capsule glides between tabs; the bar stays still
- [x] Tab changes crossfade; going deeper slides in; going back slides out
- [x] Reduced motion, reduced transparency and high contrast respected

## Notes

Built on November 4.

- **Tests:** in full headless Chrome, tab changes, push and pop each ran
  their transition. A first visit to a page whose styles weren't cached yet
  sometimes skipped its transition; Chrome then switches instantly, which is
  harmless.
- **Test browser:** Playwright's default headless shell skips cross-document
  transitions often, so test them with `channel: "chromium"`.
- **Review fixes:**
  - Slides use normal blending, so the pages don't add their colours.
  - Tab icons and labels stay above the gliding capsule (`view-transition-class: tab-item`).
  - The bar's stand-in keeps its blur during transitions.
  - A tap on the tab bar always crossfades, and Back is recognised from a
    short history kept in `sessionStorage`, so Safari, which lacks the
    Navigation API, slides the right way. Forward to any non-tab page pushes.
  - Every `/schedule/` link (`src/scripts/schedule-links.ts`) goes to today's
    page when tapped, with today worked out at the tap. The tab keeps
    prefetching the small `/schedule/` page.
  - `/speakers/` is no longer treated as a tab.
  - The design guide covers the glass bar, its 10 px gap and the
    navigation motion.
- **Tested** in full headless Chrome, with and without the Navigation API:
  schedule → event → speaker → Back → Map tab → Back → Schedule tab ran
  push, push, pop, tab, pop and tab. A frame mid-push showed no ghosting.
- **Not tested:** real iPhones couldn't be tried from here.
