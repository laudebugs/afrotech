# Plan 0004: A service worker keeps the planner working on dead convention Wi-Fi

**Status:** draft, awaiting review · **Created:** 2026-11-03

Convention halls are where phones lose signal: thousands of people share the
Wi-Fi, and the George R. Brown's concrete eats cellular. Today the planner
needs the network for every page, so the moment you most need "what's next and
where" is when it fails to load. Most of what the site does already runs in the
browser: the Now view, stars, clashes and search work from data inside each
page. This plan adds a service worker that saves the pages you need ahead of
time, so the site opens and works with no connection, and says plainly how
fresh its data is.

## What works offline, and what can't

| Works offline | How |
|---------------|-----|
| Now, every day's schedule, My plan, Notes | Saved when the site first loads (precached) |
| Event pages you've opened, and every event in your plan | Saved as you open them, and when you star them |
| Starring, clashes, filters, search, the live Now view | They already run in the browser from page data |
| Fonts, styles and scripts | Saved on first load; their hashed names never change |
| "Export to calendar" for your plan | Each starred event's `.ics` file is saved when you star it |

| Needs a connection | Why |
|--------------------|-----|
| Event pages you've never opened | 430 pages is too much to save up front; they're saved on first visit |
| Publishing a note | It goes through GitHub; drafts still save on the device |
| The city map's tiles (Phase 2) | Map tiles come from a third party; the floor plan works, because it's part of the page |
| Signing in and syncing (plan 0002) | Changes wait in the sync log and go out when you're back online |

## The service worker saves key pages up front and the rest as you go

Astro builds the worker as a page, `/sw.js`, so each build stamps it with a
build id and the list of files to save. On install, the worker precaches the
core: the Now page, `/schedule/` and its seven day pages, `/plan/`, `/notes/`,
the 404 page and every hashed file in `/_astro/`. That's about 4 MB in the
browser's storage, but only a few hundred kilobytes to download, because the
pages compress well.

After that, each kind of request gets its own rule:

| Request | Rule |
|---------|------|
| Pages | **Network first, 3-second timeout.** Fresh when the network works; the saved copy when it doesn't or is too slow; the offline page if neither exists. |
| `/_astro/*` (hashed files) | **Cache first.** A hashed file never changes, so a saved copy is always right. |
| `/event/*` pages and `.ics` files | **Saved copy first, refreshed in the background**, so they open instantly and stay current. |
| `/api/*` (plan 0002) | **Never cached.** Sync handles offline itself. |
| Other sites | Left alone. |

Starring an event also asks the worker to save that event's page and `.ics`
file, so your plan's events open and export offline even if you've never
viewed them.

## New deploys arrive without breaking the page you're on

Each deploy gets a new build id, so the browser installs the new worker
quietly in the background. The new worker takes over on your next page load,
saves its own files and deletes the previous build's cache. Pages come
network-first, so you see new data as soon as you're online. A small
"Updated, tap to reload" note appears when a newer version is ready, rather
than reloading under your thumb.

## An offline banner says how old the data is

The site stamps every build with its data time. The footer reads "Schedule
updated Wed, Nov 4, 2:30 PM". When the device goes offline, a slim banner
appears above the page: "Offline. Showing the schedule from Wed, Nov 4, 2:30
PM." It disappears when the connection returns. The banner uses `--warn` text
on `--surface`, already in the design tokens.

## Installing to the home screen protects My plan on iPhones

The site adds a web app manifest (name, plum theme colour and icons at 192 px,
512 px and a maskable version made from the favicon), so phones can install it
like an app. The install matters most on iPhones. Safari can clear a site's
stored data after about seven days without a visit, which would wipe My plan
and note drafts, but it doesn't do that to sites added to the home screen. The
My plan page therefore shows a one-time hint on iPhones: "Add to Home Screen to
keep your plan safe." Signing in (plan 0002) protects plans everywhere else.

## Testing covers offline, slow and updated

Playwright tests will cover five cases:

1. Load the site, go offline and open Now, a day page, My plan and a starred
   event's page.
2. Star an event offline and export the plan.
3. Simulate a slow network and check the three-second fallback.
4. Deploy a new build and check the update note.
5. Confirm the banner and the data stamp.

## Three proposed todos

| # | Task |
|---|------|
| 013 | Service worker: build-stamped `/sw.js`, precache, per-request rules, offline page, saving starred events |
| 022 | Manifest, icons, the iPhone "Add to Home Screen" hint and the "Updated, tap to reload" note |
| 023 | Data stamp in the footer and the offline banner |

Todo 013 already exists; it narrows to the service worker, and 022 and 023
take the rest.

## Risks

| Risk | Response |
|------|----------|
| A bad worker keeps serving a broken site | Pages are network-first, and a kill switch (`/sw.js` that unregisters itself) can ship in one deploy. |
| Storage fills on a full phone | The core is about 4 MB; the browser may evict it, and the site then simply loads from the network as today. |
| Old data looks current | The banner and footer always show when the data was last updated. |
| The Now view's progress bars drift on a saved page | They run from the device clock, so they stay right offline. |

## Three decisions before building starts

1. **Precache scope:** all seven day pages (recommended), or only today and
   tomorrow to save space?
2. **Install hint:** show "Add to Home Screen" on iPhones once (recommended), or
   never?
3. **Updates:** a "tap to reload" note (recommended), or reload new versions
   automatically on the next page you open?

Once you answer these, todo 013 starts the service worker; the site keeps
working exactly as it does now until the worker is in place.
