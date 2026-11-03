# Plan 0001: A mobile site to plan AfroTech week and find events on a map

**Status:** draft, awaiting review · **Created:** 2026-11-03

AfroTech 2026 lists 429 events across four sources: 259 official sessions and
170 community side events. None of those sources answers the three questions
you ask on the conference floor: what's on now, which of your picks clash, and
where is the next one? Each source covers only some of the events, so planning
means switching between a schedule page, two spreadsheets and a website. This plan
builds one mobile site, in four phases, that merges every list, keeps your
picks in "My plan" with clash warnings, and shows each event on a map of the
convention center or the city.

## Phase 1 must ship within a day to help this year

The conference runs from Monday, November 2, to Friday, November 6, and side
events continue through Saturday. Today is Tuesday, so the schedule and
My plan (Phase 1) need to go live by Wednesday to be useful. The maps
can follow during the week. Because the site reads its data from scripts, the
same code can serve AfroTech 2027 with new sources.

## Two kinds of user, no accounts

The site serves two kinds of user. First, **you**: building a plan, taking notes and
getting around. Second, **friends and teammates**: browsing the schedule,
copying your plan from a share link and reading your notes. Accounts would delay
Phase 1 and put a login in front of a site people check for a few seconds at a
time. So in version 1,
each device stores its own plan, and a share link copies a plan to another
device.

## Four phases, smallest useful site first

### Phase 0: Foundations (today)

- An Astro project at the repo root, deployed to Cloudflare from `main`
- One JSON file each for official and side events, in a shared format with
  stable ids, Houston times and a location key
- Design tokens and a base layout from the [design language](../design/design-language.md)

### Phase 1: Schedule, My plan and Now

- **Schedule:** official and side events by day, grouped by start time.
  Filters for day, official or side, track, free events and founder/investor
  picks. Search across titles, speakers and hosts.
- **Event detail:** time, place, speakers, description, RSVP link and an "Add
  to calendar" file. A "Show on map" button arrives in Phase 2.
- **My plan:** a star on any event adds it. The plan page groups picks by day,
  warns about overlaps, exports everything to one calendar file and creates a
  share link.
- **Now:** events happening now and starting within the hour, with your picks
  listed first.

### Phase 2: Maps

- **Convention center map:** a hand-drawn SVG of each level. Rooms change colour
  when they have events today, when an event is live and when an event is in
  your plan. Tapping a room lists its sessions. The
  [SVG research](../research/svg-floor-plan.md) explains the approach.
- **City map:** side events as pins on a map of Houston. A script looks up each
  address once and saves the coordinates in `data/geocode.json`.

### Phase 3: Near me, notes, offline use and fresh data

- **Near me:** the browser's location, or a room you pick, ranks live and
  upcoming events by distance. Your location stays on your device.
- **Notes:** the site shows the notes in `notes/`, each linked to its event.
- **Offline use:** the site keeps working when convention Wi-Fi drops.
- **Fresh data:** a scheduled GitHub Action re-runs the update scripts during
  the conference, and Cloudflare rebuilds the site on each change.

Two features wait for a later year: syncing a plan across devices, and group
plans showing who is going where.

## A static site keeps hosting simple

Astro builds every page ahead of time, and Cloudflare serves the finished files.
Because no page needs a server in version 1, the project skips Astro's
Cloudflare adapter; Wrangler serves the `dist/` folder directly. The adapter
comes back only if a later feature, such as plan sync, needs an API.

```
scripts/*.py ──► data/*.json ──► Astro build ──► static HTML and JS ──► Cloudflare
```

Five more choices complete the stack:

- **Interactivity:** small scripts inside Astro components, with no UI
  framework. Preact joins only if My plan's state gets hard to manage.
- **Saved state:** the browser's `localStorage`, under `afrotech:plan` and
  `afrotech:prefs`. The site still works when a browser blocks storage.
- **Time:** stored with its UTC offset and always shown in Houston time,
  whatever the viewer's time zone.
- **Maps:** `@panzoom/panzoom` for the floor plan and `maplibre-gl` for the
  city map, loaded only on the map pages.
- **Deploys:** Cloudflare Workers Builds, connected to the GitHub repo, builds
  each push and gives every branch a preview URL.

### One event format for every source

```ts
type Event = {
  id: string;              // official: schedule uuid; side: hash of date + title
  kind: "official" | "side";
  title: string;
  start: string; end?: string;   // ISO 8601 with -06:00
  locationKey?: string;    // key into data/venues.json
  locationLabel: string;   // the place as the source wrote it
  address?: string;
  track?: string; categories: string[];
  speakers: { name: string; title?: string; company?: string }[];
  host?: string;
  price?: string; access?: string;   // "Open", "Invite only", "Badge"
  rsvpUrl?: string;
  founderInvestorPick: boolean;
  description?: string;
  sources: string[];
};
```

`data/venues.json` maps each location key to a label, plus either a floor-plan
area and level or a latitude and longitude.

### Six pages

| Route | Shows |
|-------|-------|
| `/` | Now: live events and the next hour |
| `/schedule/[day]` | Every event that day, with filters |
| `/event/[id]` | One event's details |
| `/map` | Convention center floor plan; `/map/city` for side events |
| `/plan` | My plan, clash warnings, export and share |
| `/notes` | Shared notes |

## Five risks and how the plan handles them

| Risk | Response |
|------|----------|
| A source changes its format mid-week | The scripts stop with an error, and the last good data stays live. |
| Phone GPS is too rough indoors | An "I'm at…" room picker overrides GPS, and the map shows its accuracy. |
| Drawing the floor plan takes too long | Level 1 and the ballroom ship first; pavilions start as labelled zones. |
| Some side events lack times or addresses | Lists show "time TBA"; the city map leaves them off. |
| Sources include organisers' personal details | The site publishes only what an event listing needs. |

## Four decisions before building starts

1. **Domain:** a free `*.workers.dev` address for now, or a domain you own?
2. **Cloudflare access:** will you connect the repo to Workers Builds, or give
   GitHub Actions an API token to deploy?
3. **Notes:** public on the site, or kept in the repo only?
4. **Sync:** does a plan stored on one device, plus a share link, cover this week?

Once you approve this plan and answer these four questions, todo 001 starts the
build, and Phase 1 can be live within a day.
