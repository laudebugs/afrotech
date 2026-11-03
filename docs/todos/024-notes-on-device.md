# 024 — Notes on the device; GitHub publishing removed

**Status:** done · **Plan:** [Plan 0005](../plans/0005-notes-in-account.md) · **Depends on:** none

## Goal

Keep notes on the device, private, with My notes, an editor, a note view and "Your notes" on each session.

## Done when

- [x] `src/lib/notes.ts`: notes and a change log in `localStorage`, deleted notes kept as tombstones
- [x] My notes (`/notes/`), the editor (`/notes/new/`) and the note view (`/notes/view/`)
- [x] "Your notes" on each event page and in the schedule's bottom sheet
- [x] Markdown rendered with `markdown-it`, raw HTML off
- [x] GitHub publishing, `notes/` and the content collection removed; old drafts move into notes
- [x] The notes pages work offline

## Notes

Built on November 3:

- **Editing:** `/notes/new/?id=<note>` edits a note, so one page handles both
  new and existing notes. A note gets its id on its first save, so opening the
  editor and leaving creates nothing.
- **Old drafts:** drafts from the GitHub editor (`afrotech:note-draft:*`)
  become notes the first time My notes opens.
- **Repo link:** `NOTES_REPO` became `REPO`, because the speaker pages still
  open GitHub issues for change requests.
- **Review fixes:** a note deleted in another tab stays deleted, and further
  typing starts a new note. Done on an untouched new note saves nothing. Old
  drafts move on any page, and only once they're saved. The service worker now
  saves one copy of each notes page, whatever the query string.
- **Not changed:** the session lookup is inlined in all three notes pages
  (about 75 KB each before compression), like the old editor did, so they work
  offline with no extra file.
- **Tested** in a browser: write, view, "Your notes" on the event page and the
  bottom sheet, delete, the missing-note message, a pasted `<script>` shown as
  text, and blocked storage. Signed out, the pages send no API requests.
