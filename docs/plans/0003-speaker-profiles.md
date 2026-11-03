# Plan 0003: Speaker profiles with a short bio, sourced fun facts and links

**Status:** approved 2026-11-03, using the recommended answers below until you say otherwise · **Created:** 2026-11-03

Event pages list speakers by name only, so deciding whether a session is worth
your time means searching each person yourself. Yet the official schedule
already holds a bio, a photo and usually a LinkedIn link for almost every
speaker; the site just drops them. This plan builds a page for every speaker
from that data first, then adds a layer of fun facts and articles that are
researched, cited and reviewed before any of it appears on the site.

## The official schedule already describes 273 speakers

The schedule's raw data carries a speaker record with each session. Across all
259 sessions there are 273 distinct speakers:

| Field | Speakers with it |
|-------|------------------|
| Bio | 272 (median about 590 characters, longest about 3,200) |
| Photo | 273 |
| Job title | 272 |
| Company | 266 |
| LinkedIn | 233 |
| X (Twitter) | 21 |
| Facebook | 3 |

None of the four sources has fun facts, personal websites or articles. Those
need research (see below).

## Phase A: a page for every speaker, built from the schedule

- **`/speakers/`:** every speaker A–Z, with search by name, company or title.
  To keep lists light, it shows no photos, matching the design language.
- **`/speakers/<slug>/`** shows, in order:
  1. The photo, name, title and company.
  2. **In brief:** the bio's first one or two sentences, up to about 200
     characters.
  3. The full bio behind a "Read more" toggle.
  4. Links: LinkedIn, X and, once researched, a personal site.
  5. The speaker's sessions as timeline cards, each with its star.
- **Event pages:** speaker names link to their profiles, with a small photo
  beside each name.

`update_schedule.py` keeps the speaker records it currently throws away and
writes `data/speakers.json`: id, slug, name, title, company, plain-text bio
(paragraphs kept, HTML stripped), photo URL, links and session ids. Like the
other data files, it's generated and never edited by hand.

**Photos** have two options. The site can load them from the schedule's image
host (Sessionboard), which costs nothing and copies nothing, but breaks if that
host changes. Or it can copy each photo once, resize it to about 160 px and
serve it ourselves, which is faster and steadier but republishes the images.
**Decided on November 3: load them from the schedule's image host**, lazily,
with initials as the fallback. Headshots usually belong to the photographer, so
linking keeps us from republishing them.

## Phase B: fun facts and articles, researched and cited

Fun facts and articles have to come from research, and research about real
people can go wrong in ways a bio can't. Four rules keep it safe and accurate.

1. **Every fact cites a public page.** That means a company bio, an interview,
   a talk, a press piece or the speaker's own site. A fact without a source
   isn't published.
2. **Professional and public only.** Career moments, projects, awards, books,
   talks and causes they champion in public. Nothing about family, health, age,
   home, religion or politics, and no guesses.
3. **Matching by more than name.** Research matches each person on name plus
   company or title, and skips anyone it can't place with confidence, since
   many speakers share common names.
4. **Review before publishing.** Research lands in
   `data/sources/speaker-research.json` with `status: "draft"`, and only
   entries marked `approved` render on the site.

Each researched speaker gets up to three fun facts, up to three articles or
talks (title, publisher, date and link) and a personal website if one exists.
Each batch of research comes as a pull request with a readable table of facts
and sources, so review means reading one table and approving or striking rows.
Profiles also carry a small "Is something wrong? Ask for a change" link to a
GitHub issue form, so speakers can correct or remove anything.

**Order of work:** speakers in your plan first, then Main Stage and keynotes,
then everyone else, in batches of about 20. At a few minutes per person, all
273 is a long job, so the first batch shows whether the result is worth
finishing.

**Research to build on:** the report
[Speaker profile research sources](../../reports/Speaker%20profile%20research%20sources.md)
recommends a pipeline, a source priority, an identity-matching rubric and legal
guardrails for this phase, and a pilot on 20 speakers before the rest.

**How the research runs:** I search the web from this session for each
speaker and record what I find with its sources. Fetching full pages may hit
the same network limits as the maps; where that happens, I keep only facts the
search results state outright.

## Four proposed todos

| # | Task |
|---|------|
| 018 | Speaker data and pages from the official schedule (Phase A) |
| 019 | Research format, review table and the first batch: speakers in your plan and Main Stage |
| 020 | Remaining research batches |
| 021 | "Ask for a change" issue form and a short note on how profiles are made |

## Risks

| Risk | Response |
|------|----------|
| A wrong or invented fact | Sources are required, and nothing publishes before review. |
| Confusing two people with one name | Match on name plus company or title, and skip when unsure. |
| A speaker objects to their profile | Professional, public facts only, plus a one-click change request. |
| Photos disappear from the image host | Initials show instead; the plan can switch to self-hosting later. |
| Research takes longer than the conference lasts | Phase A ships alone and is useful without Phase B. |

## Decided, and three decisions left

On November 3 you chose to load photos from the schedule's image host.

Three questions remain before building starts:

1. **Fun facts:** are you happy with researched, cited facts that publish only
   after review? And will you review each batch, or should I?
2. **Order:** your plan, then Main Stage, then the rest?
3. **Side-event hosts:** add profiles for them too, even though the sources give
   only their names?

Once you answer these, todo 018 builds the speaker pages from the schedule
data, which works on its own while the research proceeds.
