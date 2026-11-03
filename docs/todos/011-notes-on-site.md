# 011 — Public notes: write in the browser, publish through GitHub

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md#notes-publish-through-github-so-the-site-needs-no-sign-in) · **Depends on:** 004

## Goal

Let you write a note on any session from your phone and publish it to a public
`/notes` page, with GitHub's login deciding who can publish.

## Done when

- [x] Astro content collection for `notes/*.md`, with frontmatter `eventId`, `title` and `published`
- [x] Every note shows the single author from `SITE_AUTHOR` in `src/config.ts`
- [x] `/notes` lists published notes, newest first; each note has its own page
- [x] Each event page links to its notes
- [x] "Write a note" on every session opens `/notes/new?event=<id>`, prefilled with the session's title, time and room
- [x] The editor saves drafts to `localStorage` as you type and still works when storage is blocked
- [x] "Publish" opens GitHub's new-file page with the file name and content filled in; long notes fall back to copy-and-paste
- [x] `notes/_template.md` gains the frontmatter
- [ ] Publishing a test note from a phone shows it on the live site after the rebuild

## Notes

Moved from Phase 3 to Phase 1 on November 3, because notes are most useful
during the conference.

Built on November 3:

- **Collection:** notes are an Astro content collection (`src/content.config.ts`)
  over `notes/*.md`; files starting with `_` are templates. `src/lib/notes.ts`
  loads them once per build.
- **Pages:** `/notes/` lists notes newest first; each note has a page with an
  "Edit on GitHub" link, and event pages and the details sheet link to their
  notes.
- **Editor:** `/notes/new/?event=<id>` prefills the title and section headings,
  saves drafts per event in `localStorage`, and publishes by opening GitHub's
  new-file page. Notes whose link would exceed about 7,000 characters go by
  clipboard, then an **Open GitHub** button (a fresh tap, so phones don't block
  it). **Copy Markdown** works anywhere. File names carry the publish date and
  time (`2026-11-04-1530-takeaways-….md`), so two notes never collide.
- **Author:** `SITE_AUTHOR` (now `laudebugs`) and the target repo live in
  `src/config.ts`.
- **Untested:** publishing from a phone to the live site needs you. Until the
  first note exists, the build prints one "collection is empty" warning.
