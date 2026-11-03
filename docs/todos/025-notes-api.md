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
- **Changed from the plan:** each write also stores `synced_at`, the server's
  time. A sync sends the cursor from its last sync and gets back only notes
  written since, instead of every note each time.
- **Limits:** 100 changes per request, titles up to 200 characters and bodies
  up to 100,000, measured the same way as the device. A request that would take
  an account past 1,000 live notes gets a 409 and changes nothing.
- **Tested** against `wrangler dev` with a local D1 and a test signing key:
  - an older change is ignored, and a deletion syncs with its text emptied
  - one account can't read or overwrite another's notes
  - bad ids, long bodies, too many or duplicate changes, cross-origin writes
    and signed-out reads are refused
  - the 1,000-note limit holds, and a deletion still works at the limit
  - Delete my data removes the notes
