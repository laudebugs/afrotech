# CLAUDE.md

Guidance for Claude when working in this repo.

## What this is

A tracker for AfroTech 2026 (Houston, Nov 2–6): the merged official schedule and
community side events, shared session notes, and (in progress) an Astro site to
plan your week and find events on a map of the convention center.

Start with [`docs/plans/0001-events-site.md`](docs/plans/0001-events-site.md).

## Layout

| Path | What |
|------|------|
| `docs/plans/` | Plans (`NNNN-slug.md`). Read the relevant one before building. |
| `docs/todos/` | Tasks, one per file (`NNN-slug.md`), indexed in `docs/todos/README.md`. |
| `docs/design/design-language.md` | Colors, type, spacing, components. Follow it for all UI. |
| `docs/research/` | Research notes (e.g. the SVG floor-plan approach). |
| `docs/sources.md` | Every data source and how it's pulled. |
| `reports/`, `research_notes/` | Deep-research reports and the notes behind them (e.g. speaker profile sources). |
| `scripts/` | Python (stdlib only) that fetches sources and writes `data/` and `schedule/`. |
| `data/` | Generated data (committed). `data/sources/` holds hand-exported inputs. |
| `schedule/` | Generated markdown schedules for reading on GitHub. |
| `notes/` | Session notes; copy `notes/_template.md`. |
| `src/`, `public/` | Astro site (from todo 001 onward). |

## Commands

```bash
python3 scripts/update_schedule.py      # official sessions → data/sessions.*, schedule/official.md
python3 scripts/update_side_events.py   # side events → data/side-events.csv, schedule/side-events.md
python3 scripts/build_events.py         # both → data/events/*.json, data/venues.json and data/speakers.json (the update scripts run it too)
python3 scripts/build_floor_plan.py     # traced map → src/assets/maps/grb-level-*.svg and data/floor-plan.json
python3 scripts/geocode.py              # new side-event addresses → data/geocode.json (city map pins)
```

The update scripts refuse to write if a source returns nothing or the event
count drops more than 20%; prefix with `ALLOW_SHRINK=1` to accept a real drop.
A GitHub Action (`.github/workflows/refresh-data.yml`) runs them every two hours
during the week.

The site reads events through `src/lib/events.ts`; their type is
`ScheduleEvent` in `src/lib/types.ts`, which must match `validate()` in
`scripts/build_events.py`.

```bash
npm run dev       # Astro dev server
npm run build     # astro check + build to dist/
npm run preview   # build, then serve with wrangler dev (like production)
npm run deploy    # manual deploy; needs a one-time `npx wrangler login`
npm run db:migrate:local    # apply worker/migrations/ to a local D1 (preview does this too)
```

Cloudflare Workers Builds runs `npm run build` and `npx wrangler deploy`.

The build also writes `dist/sw.js` (the offline service worker) from
`src/sw/sw.template.js`; edit the template, not the output.

## Review rules

- **Plans before code.** Write or update a plan in `docs/plans/` and wait for the
  user to review it before implementing. Don't start a todo whose plan is still a draft.
- **Code review on every PR.** Run `/code-review` at least once before opening or
  updating a pull request, and fix or explain what it finds.
- **A new branch per task.** Start every task on a fresh branch from the latest
  `main` (e.g. `claude/map-tab`), never on a branch another session uses, and
  open its PR from there.
- **Merge and keep going.** Once a PR's review findings are fixed, merge it
  yourself and start the next todo. Don't wait for the user between todos.
- **Writing.** For any prose people will read (docs, plans, READMEs, PR
  descriptions, notes), draft with the `anthropic-skills:writing` skill, then
  review the draft with `anthropic-skills:writing-review` and apply the fixes.

## Working on todos

- When asked to "do todo NNN", read the todo, its plan, and anything it depends on.
- Set its **Status** to `doing` while working and `done` when finished; tick the
  checklist; update the index table in `docs/todos/README.md`.
- Note anything that changed from the plan in the todo's **Notes**.
- New ideas that are out of scope become new todo files, not extra work.

## Conventions

- **Times:** always Houston time (`America/Chicago`, CST `-06:00` this week),
  formatted `2:30 PM`, dates `Wed, Nov 4`, regardless of the viewer's timezone.
- **Generated files** (`data/*`, `schedule/*`) are never edited by hand — change
  the script and re-run it. Two exceptions: `data/sources/` holds hand exports,
  and `data/venues.json` takes hand-added map fields (`areaId`, `level`,
  `approximate`, `note`, `lat`, `lng`) that the scripts keep. A venue with an
  `areaId` gets its level from the map and doesn't repeat it. The map itself is
  a table in `scripts/build_floor_plan.py`; edit that, not the SVGs. Speakers
  removed at their request go in `data/sources/speaker-suppressions.json`
  (never delete entries); the build drops their profile.
- **Sources:** credit each community list on the site. Don't republish the GRB
  floor-plan PDFs; we trace our own SVG. Keep organisers' personal contact
  details out of the site.
- **UI:** mobile-first, IBM Plex Sans and Plex Mono (self-hosted via
  `@fontsource`; Mono for times and short labels), design tokens only (no hard-coded colors;
  the favicon, the `theme-color` meta tags, the web app manifest and the
  app icons (`scripts/make-icons.cjs`) are the exceptions, since they can't read
  page CSS),
  44 px touch targets, works with `localStorage` blocked, respects
  `prefers-reduced-motion`.
- **Site stack:** Astro 7 static output on Cloudflare (Workers static assets),
  deployed by Cloudflare Workers Builds on every push (`main` is production;
  other branches get preview URLs). Live at
  https://afrotech26.laudebugs.me. A small Worker in `worker/` answers only
  `/api/*` (`run_worker_first`), backed by the D1 database `afrotech`; schema
  changes are new files in `worker/migrations/`, never edits to old ones, and
  only the production deploy applies them.
  Plain Astro components + small client scripts; ask before adding a UI framework.
- **No sign-in.** Per-user state (My plan, note drafts) lives in `localStorage`.
  Notes are public and publish by committing Markdown to `notes/` through GitHub.
- **Location** data stays on the device; ask for it only on a user action.
