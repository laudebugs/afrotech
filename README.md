# AfroTech 2026 — Events & Notes

Shared tracker for AfroTech Conference 2026 events and the notes we take at them.

**When:** November 2–6, 2026 · **Where:** George R. Brown Convention Center, Houston, TX

## Website

The planner site lives at **https://afrotech26.laudebugs.me**. It's an Astro
site in this repo that Cloudflare builds and deploys on every push.

```bash
npm install
```

```bash
npm run dev       # local dev server at http://localhost:4321
```

```bash
npm run preview   # build, then serve it the way Cloudflare does
```

`npm run build` type-checks and builds into `dist/`. `npm run deploy` deploys
by hand, after a one-time `npx wrangler login`; normally Cloudflare deploys on
push. Node 22.23.4 or later is
required (`.node-version` pins it for Cloudflare).

### Cloudflare setup (one time)

In the Cloudflare dashboard, open **Workers & Pages → Create → Import a
repository**, choose `laudebugs/afrotech` and use these settings:

| Setting | Value |
|---------|-------|
| Project name | `afrotech2026` (must match `name` in `wrangler.jsonc`) |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Every push to `main` then goes live. For preview URLs on other branches, also
turn on **Builds for non-production branches** in the project's Build
settings.
`wrangler.jsonc` attaches the custom domain, so Cloudflare creates its DNS
record and certificate on the first deploy.

## Docs

- [Plan: events site](docs/plans/0001-events-site.md) — what we're building and why
- [Plan: optional Google sign-in](docs/plans/0002-google-sign-in.md) — sync My plan across devices
- [Plan: speaker profiles](docs/plans/0003-speaker-profiles.md) — bios, sourced fun facts and links
- [Plan: offline support](docs/plans/0004-offline-support.md) — keep working on dead convention Wi-Fi
- [To-dos](docs/todos/README.md) — tasks, one file each
- [Design language](docs/design/design-language.md)
- [Research: interactive SVG floor plan](docs/research/svg-floor-plan.md)
- [Research: speaker profile sources](reports/Speaker%20profile%20research%20sources.md) — how to gather speaker info safely
- [Sources](docs/sources.md) — where every bit of data comes from

## Layout

| Path | What's in it |
|------|--------------|
| [`schedule/official.md`](schedule/official.md) | Full official agenda, by day (259 sessions, Houston time) |
| [`schedule/side-events.md`](schedule/side-events.md) | About 170 side events (parties, mixers, dinners, workshops) with RSVP links and founder/investor picks |
| [`data/sessions.csv`](data/sessions.csv) / [`.json`](data/sessions.json) | Official agenda as data, with descriptions, ticket levels and calendar links |
| [`data/side-events.csv`](data/side-events.csv) | Side events as data, with addresses and descriptions |
| [`notes/`](notes/) | One file per session we attend — copy [`notes/_template.md`](notes/_template.md) |
| [`scripts/`](scripts/) | Re-pull the official agenda and side events |

## Adding notes

The quickest way is on the site: open any session, tap **Write a note**, and
tap **Publish on GitHub** when you're done. GitHub opens with the file filled
in; tap **Commit changes**, and the note appears at
[/notes](https://afrotech26.laudebugs.me/notes/) about two minutes later.

To write one by hand, copy `notes/_template.md` to
`notes/YYYY-MM-DD-short-title.md`, set `eventId` to the id in the session's URL
(`/event/<id>/`), and commit it.

## Refreshing the schedules

```bash
python3 scripts/update_schedule.py
```

```bash
python3 scripts/update_side_events.py
```

No dependencies beyond Python 3.9+.

## Sources

- Official schedule: https://afrotechconference.com/schedule
- AfroTech Guide: https://afrotech.guide/
- Side events (Google Sheet): https://docs.google.com/spreadsheets/d/1PLDLOdFCuwDAy4fe5y09hb4KgYlX3bsgX60U2z2KE_0/edit
- Side events (Adaptive Foundation, OneDrive — saved in `data/sources/` since OneDrive blocks automated downloads): https://1drv.ms/x/c/201780541da98428/IQAwneocjcw7RLgXigZPaCX-Afj6iRzSioL8HrnOZ6uMc-Y
