# 025 — Notes table and API

**Status:** done · **Plan:** [Plan 0005](../plans/0005-notes-in-account.md) · **Depends on:** 024

## Goal

Store notes in D1 and let a signed-in account read and update them.

## Done when

- [x] Migration `0002_notes.sql`
- [x] `GET /api/notes` and `POST /api/notes`, newest version wins per note
- [x] Delete my data removes notes

## Notes

Built on November 3:

- **Rows:** `notes` is keyed by account and the device's note id, so two
  accounts can't touch each other's notes even with the same id.
- **Changed from the plan:** each write takes the next number from the
  account's `notes_seq`, inside the write's transaction. A device keeps the
  highest number it has seen and asks only for notes after it, a page of 50 at
  a time. A server clock would miss notes when two writes overlap; the counter
  can't.
- **Conflicts:** the newer `updatedAt` wins. On a tie, a deletion wins, then
  the greater body, so devices always settle on one version. Deleting a note
  the server never had stores nothing.
- **Limits:** 100 changes per request, titles up to 200 characters and bodies
  up to 100,000, measured the same way as the device. A request that would
  raise an account above 1,000 live notes gets a 409 and changes nothing;
  swapping one note for another at the limit still works.
- **Deploy:** `npm run deploy` now applies D1 migrations first. Workers Builds
  needs the same in its deploy command, or Delete my data fails on the missing
  table.
- **Tested** against `wrangler dev` with a local D1 and a test signing key:
  - an older change is ignored, a tie settles the same way in either order,
    and a deletion syncs with its text emptied
  - one account can't read or overwrite another's notes
  - bad ids, long bodies, too many or duplicate changes, cross-origin writes
    and signed-out reads are refused
  - the limit holds, and 1,001 rows read back in 21 pages
  - Delete my data removes the notes
