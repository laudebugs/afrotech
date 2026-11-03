# Plan 0008: Fill side-event gaps from their own pages, and open Directions in a maps app

**Status:** built 2026-11-03 (todos 032–034): iPhone asks which maps app; event pages are read in the GitHub Action · **Created:** 2026-11-03

The community lists give each side event a link to its own page on posh.vip,
Eventbrite, Luma or a few other sites, but the lists themselves leave gaps.
Of 171 side events, 19 have no address, 28 no description and 7 no end time.
The event pages usually have these, in a machine-readable block that the sites
publish for search engines. Separately, **Directions** opens Google Maps in the
browser, when on a phone you want the maps app. This plan reads each event's
own page to fill the gaps, and makes Directions open a maps app on phones.

## Part 1: read each side event's own page

### What the pages hold

Posh, Eventbrite and Luma pages carry a standard schema.org `Event` block
(JSON-LD) with the start and end time, the venue and street address, the
price, the organiser, an image and the description. A new script,
`scripts/enrich_events.py`, fetches each side event's link once and reads that
block. It uses Python's standard library, like the other scripts.

| Site | Events | Reads |
|------|--------|-------|
| posh.vip | 70 | the JSON-LD `Event` block |
| Eventbrite | 32 | the JSON-LD `Event` block |
| Luma | 20 | the JSON-LD `Event` block |
| afrotechconference.com | 18 | nothing new: these are AfroTech's own partner listings |
| Others (Eventnoire, Cvent, RSVPify, forms) | 19 | the JSON-LD block where there is one; otherwise skipped |

### What it changes, and what it leaves alone

The community lists stay the source of truth. The script only **fills empty
fields**: address, end time, description and price. When an event page
disagrees with a list, for example on the start time, the script doesn't
overwrite the list. It records the difference in a review table in
`schedule/side-events.md`, so a person can check it.

Results go to `data/event-pages.json`, cached by URL with the date
read. `build_events.py` merges them, and each event's `sources` names the page
that filled a field. Event pages are fetched at most once a day, one at a
time, with a plain user agent and no sign-in.

New addresses also go through `geocode.py`, so these events gain pins on the
city map.

### Where it runs

This sandbox can't reach posh.vip, Eventbrite or Luma. The **refresh-data**
GitHub Action can, and it already runs every two hours, so the script runs
there, called by `update_side_events.py` before it builds the events. Its parser is tested here on sample
pages shaped like the sites' published `Event` blocks; the first run against
the real pages is the Action's, and its results get a review before the site
relies on them.

## Part 2: Directions opens a maps app

Each event page and each city-map pin has a **Directions** link. On a phone it
will open a maps app:

| Device | What happens |
|--------|--------------|
| iPhone, iPad | A small sheet asks which app: Apple Maps, Google Maps or Waze. Your last choice is listed first. |
| Android | `geo:0,0?q=…` opens Android's own chooser: Google Maps, Waze or any maps app |
| Computer | Google Maps directions open in a new tab |

Each choice on the iPhone sheet uses the app's own link: `maps.apple.com`,
Google Maps' `maps/dir` link and `waze.com/ul`. iOS opens these in the app when
it's installed and in the browser otherwise, so a choice never fails silently.
The last choice is kept in `localStorage`, which can be blocked; the sheet
then just lists Apple Maps first.

The page is built with the computer link, so it works without scripts. A small
script takes over the tap on a phone. The links send the street address,
which the maps apps place more accurately than the free geocoder behind our
city map.

## Three todos

| # | Task |
|---|------|
| 032 | Directions open a maps app on phones, with a chooser on iPhone |
| 033 | `enrich_events.py`: read JSON-LD from side-event pages into `data/event-pages.json` |
| 034 | Merge the results into events, the review table and the refresh Action |

Todo 032 doesn't depend on the others, so it ships first.

## Decided

On November 3 you asked for the iPhone to ask which maps app to use, and for
the event pages to be read only in the GitHub Action, not from this sandbox.
