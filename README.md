# AfroTech 2026 — Events & Notes

Shared tracker for AfroTech Conference 2026 events and the notes we take at them.

**When:** November 2–6, 2026 · **Where:** George R. Brown Convention Center, Houston, TX

## Docs

- [Plan: events site](docs/plans/0001-events-site.md) — what we're building and why
- [To-dos](docs/todos/README.md) — tasks, one file each
- [Design language](docs/design/design-language.md)
- [Research: interactive SVG floor plan](docs/research/svg-floor-plan.md)
- [Sources](docs/sources.md) — where every bit of data comes from

## Layout

| Path | What's in it |
|------|--------------|
| [`schedule/official.md`](schedule/official.md) | Full official agenda, by day (259 sessions, Houston time) |
| [`schedule/side-events.md`](schedule/side-events.md) | 174 side events (parties, mixers, dinners, workshops) with RSVP links and founder/investor picks |
| [`data/sessions.csv`](data/sessions.csv) / [`.json`](data/sessions.json) | Official agenda as data, with descriptions, ticket levels and calendar links |
| [`data/side-events.csv`](data/side-events.csv) | Side events as data, with addresses and descriptions |
| [`notes/`](notes/) | One file per session we attend — copy [`notes/_template.md`](notes/_template.md) |
| [`scripts/`](scripts/) | Re-pull the official agenda and side events |

## Adding notes

1. Copy `notes/_template.md` to `notes/YYYY-MM-DD-short-session-name.md`.
2. Fill it in during or after the session.
3. Add a link to it in the session list below.

## Refreshing the schedules

```bash
python3 scripts/update_schedule.py
```

```bash
python3 scripts/update_side_events.py
```

No dependencies beyond Python 3.9+.

## Notes so far

_None yet._

## Sources

- Official schedule: https://afrotechconference.com/schedule
- AfroTech Guide: https://afrotech.guide/
- Side events (Google Sheet): https://docs.google.com/spreadsheets/d/1PLDLOdFCuwDAy4fe5y09hb4KgYlX3bsgX60U2z2KE_0/edit
- Side events (Adaptive Foundation, OneDrive — saved in `data/sources/` since OneDrive blocks automated downloads): https://1drv.ms/x/c/201780541da98428/IQAwneocjcw7RLgXigZPaCX-Afj6iRzSioL8HrnOZ6uMc-Y
