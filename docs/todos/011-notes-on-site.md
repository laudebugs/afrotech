# 011 — Public notes: write in the browser, publish through GitHub

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md#notes-publish-through-github-so-the-site-needs-no-sign-in) · **Depends on:** 004

## Goal

Let you write a note on any session from your phone and publish it to a public
`/notes` page, with GitHub's login deciding who can publish.

## Done when

- [ ] Astro content collection for `notes/*.md`, with frontmatter `eventId`, `title` and `published`
- [ ] Every note shows the single author from `SITE_AUTHOR` in `src/config.ts`
- [ ] `/notes` lists published notes, newest first; each note has its own page
- [ ] Each event page links to its notes
- [ ] "Write a note" on every session opens `/notes/new?event=<id>`, prefilled with the session's title, time and room
- [ ] The editor saves drafts to `localStorage` as you type and still works when storage is blocked
- [ ] "Publish" opens GitHub's new-file page with the file name and content filled in; long notes fall back to copy-and-paste
- [ ] `notes/_template.md` gains the frontmatter
- [ ] Publishing a test note from a phone shows it on the live site after the rebuild

## Notes

Moved from Phase 3 to Phase 1 on November 3, because notes are most useful
during the conference.
