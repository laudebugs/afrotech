# 018 — Speaker pages from the official schedule

**Status:** todo · **Plan:** [Plan 0003](../plans/0003-speaker-profiles.md) · **Depends on:** —

## Goal

Give every speaker a page built from the official schedule's data (plan 0003, Phase A).

## Done when

- [ ] `update_schedule.py` keeps speaker records; `build_events.py` writes `data/speakers.json` (id, slug, name, title, company, plain-text bio, photo URL, links, session ids)
- [ ] `/speakers/`: A–Z directory with search by name, company or title; no photos
- [ ] `/speakers/<slug>/`: photo from the schedule's image host (lazy, initials fallback), name, title, company, "In brief", full bio behind Read more, links, their sessions
- [ ] Event pages link speaker names to profiles, with a small photo
- [ ] schema.org `Person` markup on profiles
- [ ] A `data/sources/speaker-suppressions.json` list the build respects, so removals stick

## Notes

Photos load from the schedule's image host (decided November 3).
