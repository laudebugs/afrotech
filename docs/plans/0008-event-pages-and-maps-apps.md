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

**Updated November 3, at your request:** each event's own page is now the
authority on its name, date, start and end time, and location. Where a page
was read and says something different, the site uses the page's version. A
page read without any location removes ours. A page that gives less than we
have (only a city, or a venue name without an address, as many do until you
RSVP) doesn't replace our address, and convention-center events keep their
map spot. Price and description still only fill gaps.

Three safeguards keep this from doing harm:

- **Only pages that were read change anything.** A page that fails to load,
  has no Event block, is shared by events on several days (a series page), or
  shows a date outside the week (a recurring event's next date) changes
  nothing.
- **Ids don't change.** An event's id still comes from the list's own date
  and name, so a rename or a move doesn't break saved plans or notes.
- **Every change is listed.** "Changes from event pages" in
  `schedule/side-events.md` shows what the list said and what the page says,
  and cancellations appear there too.

Small differences in spelling ("St" or "Street", case or punctuation) don't
count as changes. The CSV of lists keeps the lists' own values; the change
happens when the site's events are built.

Results go to `data/event-pages.json`, cached by URL with the date read, and
each changed event's `sources` includes "event page". Event pages are fetched
at most once a day, one at a time, with a plain user agent and no sign-in.

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
| 035 | Let the page win on name, date, times and location (your November 3 request) |

Todo 032 doesn't depend on the others, so it ships first.

## Decided

On November 3 you asked for the iPhone to ask which maps app to use, and for
the event pages to be read only in the GitHub Action, not from this sandbox.
