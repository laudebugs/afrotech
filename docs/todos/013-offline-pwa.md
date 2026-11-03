# 013 — Service worker: precache, per-request rules and offline page

**Status:** done · **Plan:** [Plan 0004](../plans/0004-offline-support.md) · **Depends on:** 004

## Goal

Make the site open and work with no connection, as plan 0004 describes.

## Done when

- [x] `/sw.js` built by Astro, stamped with a build id and the precache list
- [x] Precache Now, `/schedule/` and all seven day pages, `/plan/`, `/notes/`, the 404 page and `/_astro/*`
- [x] Pages network-first with a 3-second timeout, then the saved copy, then an offline page
- [x] `/_astro/*` cache-first; `/event/*` and `.ics` stale-while-revalidate; `/api/*` never cached
- [x] Starring an event saves its page and `.ics` file
- [x] New builds replace the old cache; a kill-switch worker is documented
- [x] Playwright: offline Now, day page, My plan, starred event page and plan export

## Notes

Precaches all seven days, the plan's recommended default.

Built on November 3:

- **How it's made:** `integrations/service-worker.mjs` writes `dist/sw.js` after
  each build from `src/sw/sw.template.js`. The build id is a hash of the
  template and every precached file, so a rebuild with no changes doesn't make
  phones update. It precaches 14 pages (Now, `/schedule/` and seven days,
  `/plan/`, `/notes/`, `/speakers/`, `/map/`, `/offline/`) plus the hashed CSS,
  JS and woff2 fonts.
- **Starred events:** `src/scripts/sw-register.ts` registers the worker in
  production builds and posts the starred ids on load, on every plan change and
  when a new worker takes over. The worker then saves those events' pages and
  `.ics` files.
- **Updates:** a new worker takes over at once (`skipWaiting`) and drops older
  caches, including saved event pages, since they point at the old styles.
  Todo 022 replaces this with a "tap to reload" note.
- **`Vary: Origin`:** some servers send it, and module scripts carry an
  `Origin` header the precache request didn't, so lookups would miss. Every
  lookup ignores `Vary`. Without that, page scripts failed to load offline.
- **Kill switch:** to switch the worker off, deploy a `dist/sw.js` containing
  only `self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", async () => { await self.registration.unregister(); const cs = await self.clients.matchAll(); cs.forEach((c) => c.navigate(c.url)); });`
  (`public/_headers` already makes browsers check `/sw.js` on every visit).
- **Tested** (Playwright, offline): Now, a filtered day page, another day, My
  plan, the map, a starred event never opened, the offline page for unsaved
  pages, plan export and fonts. **Not tested:** the three-second slow-network
  fallback, because Chromium's throttling doesn't reach the worker's own
  requests.
