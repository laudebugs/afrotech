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
- **Not tested:** real iPhones couldn't be tried from here.
