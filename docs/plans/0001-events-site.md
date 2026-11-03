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

## Two kinds of user, and no sign-in

The site serves two kinds of user. First, **you**: building a plan, writing
notes and getting around. Second, **everyone else**: browsing the schedule,
copying a plan from a share link and reading your notes, which are public.
Sign-in would delay Phase 1 and put a login in front of a site people check for
a few seconds at a time. So the site has no accounts. Each browser keeps its own
plan in `localStorage`, and a share link copies a plan to another device.

## Four phases, smallest useful site first

### Phase 0: Foundations (today)

- An Astro project at the repo root, deployed to Cloudflare from `main`
- One JSON file each for official and side events, in a shared format with
  stable ids, Houston times and a location key
- Design tokens and a base layout from the [design language](../design/design-language.md)

### Phase 1: Schedule, My plan, Now and Notes

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
- **Notes:** a public `/notes` page lists every published note, and each event
  page shows its notes. A "Write a note" button on any session opens an editor;
  the next section explains how a note gets published.

### Phase 2: Maps

- **Convention center map:** a hand-drawn SVG of each level. Rooms change colour
  when they have events today, when an event is live and when an event is in
  your plan. Tapping a room lists its sessions. The
  [SVG research](../research/svg-floor-plan.md) explains the approach.
- **City map:** side events as pins on a map of Houston. A script looks up each
  address once and saves the coordinates in `data/geocode.json`.

### Phase 3: Near me, offline use and fresh data

- **Near me:** the browser's location, or a room you pick, ranks live and
  upcoming events by distance. Your location stays on your device.
- **Offline use:** the site keeps working when convention Wi-Fi drops.
- **Fresh data:** a scheduled GitHub Action re-runs the update scripts during
  the conference, and Cloudflare rebuilds the site on each change.

Two features wait for a later year: syncing a plan across devices, and group
plans showing who is going where.

## Notes publish through GitHub, so the site needs no sign-in

A public site with no sign-in can't accept posts directly, because anyone could
then post. Instead, each note lives as a Markdown file in `notes/`, and
publishing a note means adding that file to the repo. GitHub's own login then
decides who can publish, and the site stays a set of static files.

Publishing a note from a phone takes four steps:

1. **Write.** On any session, tap "Write a note". The editor fills in the
   session's title, time and room, and saves the draft in `localStorage` as you
   type, so a dropped connection loses nothing.
2. **Publish.** Tap "Publish". The site opens GitHub's "new file" page for
   `notes/`, with the file name and the note already filled in.
3. **Commit.** On GitHub, signed in as yourself, tap "Commit changes".
4. **Live.** Cloudflare rebuilds the site, and the note appears on `/notes`
   and on its session's page about a minute later.

Each note file starts with a short header that links it to its session:

```md
---
eventId: 37935c43-4927-478a-a1f3-78ce7f779172
title: "Takeaways: Building AfroTech.guide"
author: your-name
published: 2026-11-04T15:30:00-06:00
---
```

GitHub's "new file" link carries the note inside the URL, which fits notes up
to about a thousand words. For a longer note, the site copies the text to the
clipboard and opens an empty "new file" page, so you paste once before
committing. Editing a published note works the same way, through GitHub's edit
page. You can also skip the site entirely: ask Claude to write up a note, or add
the file from any editor.

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
| `/notes` | Public notes, newest first; `/notes/new` is the editor |

## Six risks and how the plan handles them

| Risk | Response |
|------|----------|
| A source changes its format mid-week | The scripts stop with an error, and the last good data stays live. |
| Phone GPS is too rough indoors | An "I'm at…" room picker overrides GPS, and the map shows its accuracy. |
| Drawing the floor plan takes too long | Level 1 and the ballroom ship first; pavilions start as labelled zones. |
| Some side events lack times or addresses | Lists show "time TBA"; the city map leaves them off. |
| Sources include organisers' personal details | The site publishes only what an event listing needs. |
| A browser clears `localStorage` | My plan and note drafts disappear on that device. The share link and "Export to calendar" double as backups. |

## Decided, and two decisions left

You settled two questions on November 3. The site has **no sign-in**, and each
browser stores its plan in `localStorage`. **Notes are public**, published
through GitHub as described above.

Two questions remain before building starts:

1. **Domain:** a free `*.workers.dev` address for now, or a domain you own?
2. **Cloudflare access:** will you connect the repo to Workers Builds, or give
   GitHub Actions an API token to deploy?

Once you approve this plan and answer these two questions, todo 001 starts the
build, and Phase 1 can be live within a day.
