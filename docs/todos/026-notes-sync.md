# 026 — Sync notes across devices

**Status:** done · **Plan:** [Plan 0005](../plans/0005-notes-in-account.md) · **Depends on:** 025

## Goal

Keep notes in step across a signed-in person's devices, and update the privacy page and the rules.

## Done when

- [x] `src/scripts/notes-sync.ts`: sync on load, after typing, and when back online
- [x] First sign-in uploads the device's notes
- [x] `/privacy`, `CLAUDE.md` and plan 0001 describe private notes

## Notes

Built on November 3:

- **Sync:** `src/scripts/notes-sync.ts` sends changed notes in chunks of 100,
  then reads pages since this device's cursor. It runs on page load, three
  seconds after typing stops, when the tab is hidden or shown again, and when
  the connection returns. Plan and notes sync share one `/api/me` call
  (`src/scripts/whoami.ts`).
- **Added to the plan:** signing out syncs first, then removes notes from the
  device, so private notes don't stay on a shared phone. If some changes
  haven't reached the account, it asks before signing out. Delete my data
  keeps the device's copy, as it does for My plan.
- **Ties:** the device uses the server's rule (newer time, then a deletion,
  then the greater body), so both settle on the same version.
- **Tested** with two browsers against `wrangler dev`:
  - a note written before sign-in reaches the second device
  - an edit and a deletion each cross over
  - a note written offline syncs when the connection returns
  - sign-out clears the device while the account keeps the notes
  - signed out, no API requests are sent
