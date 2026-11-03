# 018 — Speaker pages from the official schedule

**Status:** done · **Plan:** [Plan 0003](../plans/0003-speaker-profiles.md) · **Depends on:** —

## Goal

Give every speaker a page built from the official schedule's data (plan 0003, Phase A).

## Done when

- [x] `update_schedule.py` keeps speaker records; `build_events.py` writes `data/speakers.json` (id, slug, name, title, company, plain-text bio, photo URL, links, session ids)
- [x] `/speakers/`: A–Z directory with search by name, company or title; no photos
- [x] `/speakers/<slug>/`: photo from the schedule's image host (lazy, initials fallback), name, title, company, "In brief", full bio behind Read more, links, their sessions
- [x] Event pages link speaker names to profiles, with a small photo
- [x] schema.org `Person` markup on profiles
- [x] A `data/sources/speaker-suppressions.json` list the build respects, so removals stick

## Notes

Photos load from the schedule's image host (decided November 3).

Built on November 3:

- **Data:** `data/speakers.json` holds 273 speakers: 272 with a brief, all with
  photos, 233 with links. `update_schedule.py` now keeps each speaker's id, bio,
  photo and links on the sessions, and `build_events.py` builds the profiles.
- **Links:** each link is labelled by where it actually points (LinkedIn, X,
  Facebook, Instagram, TikTok, YouTube, GitHub or Website), because the source's
  "LinkedIn" field sometimes holds another site. Bare home pages such as
  `https://linkedin.com` are dropped, and only `https` links pass validation.
- **Brief:** the bio's first sentence or two, up to 200 characters. It doesn't
  split after initials or titles ("Charles R.", "Dr.").
- **Photos:** load lazily from the schedule's image host, with
  `referrerpolicy="no-referrer"`. Initials sit behind each photo and show if it
  fails. The photo styles live in `src/styles/speaker-photo.css`, so the
  schedule's bottom sheet styles them too.
- **Removals:** `data/sources/speaker-suppressions.json` lists removed speakers;
  the build drops their profile and unlinks their name on events.
- **Navigation:** the footer links to `/speakers/`. The tab bar stays at four
  tabs.
