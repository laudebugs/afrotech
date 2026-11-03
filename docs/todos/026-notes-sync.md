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
- **Review fixes:**
  - Another account's notes never upload: if a device's notes came from a
    different account (its session ended without signing out), the next
    sign-in clears them from the device first. Notes written while signed
    out in between go too; privacy wins over keeping them.
  - Sign-out clears the device only after the server ends the session, and
    stops any sync still running so nothing is written back.
  - When a change loses on the server, the response carries the winning
    version (`conflicts`), so a device with a slow clock can't stay out of
    step.
  - A 409 (note limit) stops retries for the page, and sign-out explains it.
  - Plan 0001 and the storage helpers are updated.
- **Second review** (all nine findings fixed):
  - A note's session id is checked before saving and sending, so a bad
    `?event=` link can't block every other note from syncing.
  - An editor open in another tab locks when you sign out, so it can't write
    the note back.
  - When a session expires without signing out, notes already in the
    account leave the device.
  - A device whose fast clock the server clamped takes the server's copy, so
    later edits from other devices still reach it.
  - Done without typing saves nothing.
  - The server counts live notes rather than reading every row on each sync,
    and a multi-request upload asks for a page of notes only once.
  - A local change clears the note-limit stop.
  - Client scripts share one API helper (`src/scripts/api.ts`).
- **Ties:** the device uses the server's rule (newer time, then a deletion,
  then the greater body), so both settle on the same version.
- **Tested** with two browsers against `wrangler dev`:
  - a note written before sign-in reaches the second device
  - an edit and a deletion each cross over
  - a note written offline syncs when the connection returns
  - sign-out clears the device while the account keeps the notes
  - signed out, no API requests are sent
  - a second account signing in on the device gets none of the first
    account's notes
  - a device with a lagging clock takes the newer version
  - signing out offline keeps you signed in, with your notes, and says why
