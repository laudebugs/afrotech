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
  - Tab icons and labels stay above the gliding capsule.
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
- **Second review fixes:**
  - Schedule links are pointed at today on load (prefetch then gets the
    right page) and again at every tap, honouring `?now=`.
  - Only a plain, uncancelled tap on the bar counts as a tab change.
  - The session history is used for Back only where the Navigation API is
    missing, and it follows replaces and the `/schedule/` redirect.
  - The desktop rail stays solid, and the transition blur follows Reduce
    Transparency.
  - The bar uses `--space-1`, `--radius-pill` and `--glass-blur`.
- **Tested** in full headless Chrome, with and without the Navigation API:
  schedule → event → speaker → Back → Map tab → Back → Schedule tab ran
  push, push, pop, tab, pop and tab. A frame mid-push showed no ghosting.
- **Not tested:** real iPhones couldn't be tried from here.
- **Flicker fix (November 4):**
  - In Chrome, about half of tab changes skipped the page transition, nearly
    every change into Map among them. The capsule then started its glide on
    the press and snapped to the new tab. When the transition did run, the
    capsule moved twice: the press glide, then the transition's spring.
  - The capsule glide no longer depends on the page transition. On leaving a
    page, the layout's head script saves where the capsule is, counted in
    tabs from the bar's corner. The new page's capsule starts from there and
    finishes the glide, including on Back from the page cache. It's a
    scripted animation, because Chrome drops CSS transitions that start
    before a page transition takes over. It waits for the first frame, since
    laying out Now or Saved can take longer than the glide. It takes its
    timing from the capsule's CSS transition.
  - A second tap while the capsule is still gliding in carries on from where
    the capsule is.
  - The capsule and the tab labels no longer have their own transition
    names. They ride with the bar, so nothing swaps mid-transition.
  - The glide eases without overshoot (340 ms), so it no longer wobbles.
  - Tested with frame captures and per-frame positions: Now to Map, Saved to
    Now, Back to Saved, a second tap mid-glide, and the desktop rail all
    glide continuously, with no jump.
  - Still to check on a real iPhone.
