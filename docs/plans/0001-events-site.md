# Plan 0001 — AfroTech events site

**Status:** draft · **Created:** 2026-11-03

## Why

The conference runs **Mon Nov 2 – Fri Nov 6** (side events through Sat Nov 7).
There are 259 official sessions and 170 side events spread over four lists, and
none of them answer the questions you actually have on the floor:

- What's on **right now**, and what's next?
- Which of the things **I picked** clash?
- **Where** is it, and what's **close to me**?

So: a fast, mobile-first site that merges every list, lets you build your own
plan, and shows it all on a map of the convention center and the city.

> **Timing.** It's already Day 2. Phase 1 has to be usable within a day to be
> worth it this year; the map phases can land during the week. Everything is
> built so it can be reused for AfroTech 2027.

## Users

- **Me** (primary): building a personal plan, taking notes, getting around.
- **Friends / team**: viewing the schedule, copying my plan via a share link,
  reading the notes.

No accounts in v1. Plans live on the device; sharing is a link.

## Features

### Phase 0 — Foundations (today)
- Astro project at the repo root, deployed to Cloudflare from `main`.
- Normalised event data: one JSON file each for official sessions and side
  events, stable ids, ISO times with Houston offset, a location key.
- Design tokens and base layout from the [design language](../design/design-language.md).

### Phase 1 — Schedule + My plan (MVP)
- **Schedule:** official + side events, by day, grouped by start time.
  Filters: day, official/side, track, free, founder/investor picks. Search by
  title, speaker, host.
- **Event detail sheet:** time, place, speakers, description, RSVP link, "Add
  to calendar" (.ics), "Show on map" (Phase 2).
- **My plan:** star any event. Stored in `localStorage`. Grouped by day with
  **clash warnings** for overlaps. Export all as one .ics. **Share link**
  (event ids in the URL) that someone else can open and import.
- **Now:** what's live and what starts in the next 60 minutes, my picks first.

### Phase 2 — Maps
- **Convention center map:** hand-traced SVG per level, rooms coloured by
  state (has events today / live now / in my plan). Tap a room → its sessions.
  Pan and zoom, list fallback. See [SVG research](../research/svg-floor-plan.md).
- **City map:** side events on a MapLibre map (OpenFreeMap tiles), addresses
  geocoded once at build time and cached in `data/geocode.json`.

### Phase 3 — Near me, notes, polish
- **Near me:** browser geolocation (opt-in, stays on device) + "I'm at…" room
  picker. Ranks what's live or starting soon by distance.
- **Notes on the site:** render `notes/*.md` and link each to its event by id.
- **Offline:** cache the app and data (PWA) for dead-zone convention Wi-Fi.
- **Auto-refresh data:** scheduled GitHub Action runs the update scripts during
  the conference and commits changes; Cloudflare rebuilds on push.

### Later (not this year unless needed)
- Sync my plan across devices (Cloudflare D1 + magic link).
- Group plans ("who's going where").

## Architecture

```
scripts/*.py ──► data/*.json ──► Astro (build time) ──► static HTML/JS ──► Cloudflare
   (fetch sources)    (committed)      src/pages, src/components        Workers static assets
```

- **Astro 7, static output.** All pages pre-rendered. No server needed in v1,
  so no Cloudflare adapter: Wrangler serves `./dist` as static assets.
  (Add `@astrojs/cloudflare` later only if we need an API, e.g. plan sync.)
- **Client JS:** small Astro `<script>` modules and web components — no UI
  framework to start. Add Preact only if My plan's state gets unwieldy.
- **State:** `localStorage` (`afrotech:plan`, `afrotech:prefs`), wrapped so the
  site still works when storage is blocked.
- **Time:** stored as ISO strings with offset; displayed in `America/Chicago`
  regardless of the viewer's timezone.
- **Map libraries:** `@panzoom/panzoom` (floor plan), `maplibre-gl` (city map,
  loaded only on the map page).
- **Deploy:** Cloudflare Workers Builds connected to the GitHub repo
  (build `npm run build`, deploy `npx wrangler deploy`). Preview URL per branch.

### Data model

```ts
type Event = {
  id: string;              // official: schedule uuid; side: hash(date + title)
  kind: "official" | "side";
  title: string;
  start: string; end?: string;   // ISO 8601 with -06:00
  locationKey?: string;    // → data/venues.json (floor-plan area or geocoded venue)
  locationLabel: string;   // as the source wrote it
  address?: string;
  track?: string; categories: string[];
  speakers: { name: string; title?: string; company?: string }[];
  host?: string;
  price?: string; access?: string;   // "Open", "Invite only", "Badge"…
  rsvpUrl?: string;
  founderInvestorPick: boolean;
  description?: string;
  sources: string[];
};
```

`data/venues.json` maps each location key to `{ label, level?, areaId?, lat?, lng? }`.

### Pages

| Route | Content |
|-------|---------|
| `/` | Now (live + next hour) |
| `/schedule/[day]` | Full schedule for a day, filters |
| `/event/[id]` | Event detail (also used as the sheet's content) |
| `/map` | Floor plan with level switcher; `/map/city` for side events |
| `/plan` | My plan, clashes, export, share |
| `/notes` | Shared notes |

## Risks

| Risk | Mitigation |
|------|------------|
| Sources change format mid-week | Scripts fail loudly; last good data stays committed. |
| Indoor GPS too rough to be useful | Manual "I'm at…" picker; honest accuracy circle. |
| Tracing the floor plan takes long | Ship Level 1 + ballroom first; lounges/pavilions as labelled zones. |
| Side events without times/addresses | Show "time TBA"; leave off the city map but keep in lists. |
| Hosts' data includes personal details | Only publish what's needed for an event listing. |

## Open questions

1. **Domain / name** — subdomain of an existing domain, or `*.workers.dev` for now?
2. **Cloudflare access** — connect the repo to Workers Builds yourself, or give
   CI an API token so deploys run from GitHub Actions?
3. **Notes visibility** — are shared notes public on the site, or only in the repo?
4. **Plan sync** — is device-only + share link enough for this week?
