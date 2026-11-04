# 022 — Install to home screen, icons and update note

**Status:** done · **Plan:** [Plan 0004](../plans/0004-offline-support.md) · **Depends on:** 013

## Goal

Make the planner installable, and tell people when a newer version is ready.

## Done when

- [x] Web app manifest: name, plum theme colour, 192, 512 and maskable icons from the favicon
- [x] One-time "Add to Home Screen to keep your plan safe" hint on iPhones
- [x] "Updated, tap to reload" note when a new service worker is waiting
- [x] CLAUDE.md lists the manifest's colours as a hard-coded-colour exception

## Notes

Hint shown once, and tap-to-reload updates: the plan's recommended defaults.

Built on November 3:

- **Manifest:** `public/manifest.webmanifest`, with icons in `public/icons/`
  (192, 512, maskable 512 and a 180 px Apple touch icon). The icons are
  rendered by `scripts/make-icons.cjs` from the favicon design in Plex Sans.
- **iPhone hint:** shows on My plan on iPhones and iPads outside the installed
  app, until you tap "Got it" (`afrotech:ios-hint-dismissed`).
- **Updates:** a first install takes over at once. An update now waits, and a
  "A newer version is ready. Tap to reload" note appears above the tab bar.
  Tapping it activates the new worker and reloads.
- **Tested:** a changed worker showed the note; tapping it reloaded under the new
  build's cache. The hint showed on an emulated iPhone 13, stayed hidden after
  dismissing, and never showed on desktop.
- **Icon redesign (November 3):** the mark is now "A26" in Plex Sans on the plum
  tile, with soft plant-like threads behind it. `public/favicon.svg` is the
  source, and `scripts/make-icons.cjs` renders the PNGs from it with Plex
  embedded. The earlier favicon never rendered: its comment held a double
  hyphen ("--accent"), which XML forbids.
- **Icon text (November 4):** "A26" became "Afro" and "Tech" on two lines,
  same tile, threads and font.
