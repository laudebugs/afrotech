# 016 — Sync My plan across devices

**Status:** done · **Plan:** [Plan 0002](../plans/0002-google-sign-in.md) · **Depends on:** 015

## Goal

Keep stars in step across a signed-in person's devices.

## Done when

- [x] Local change log with timestamps (`afrotech:plan-changes`)
- [x] `GET`/`POST /api/plan`: per-event latest change wins; unstars kept as `starred = 0`
- [x] First sign-in merges local stars with the saved plan
- [x] Syncs on load, a second after a change, and when the tab returns; offline changes wait
- [x] Signed-out behaviour unchanged

## Notes

Stars only, the plan's recommended default; note drafts stay on the device.

Built on November 3, ahead of sign-in (todo 015):

- **Server:** `GET /api/plan` and `POST /api/plan` in `worker/plan.ts`. A change
  is applied only if it's newer than the stored one, device clocks running
  more than 5 minutes fast are clamped to now, and a request holds at most 500
  changes. Writes need a same-origin `Origin` header and a JSON body.
- **Browser:** `src/lib/plan.ts` logs each star and unstar with its time
  (`afrotech:plan-changes`). `src/scripts/plan-sync.ts` sends the log and takes
  back the merged plan; changes made mid-request still win locally. It syncs
  on load, a second after a change, on returning to the tab and on coming back
  online.
- **First sign-in:** stars already on the device upload as "very old"
  (`updatedAt: 1`), so they fill gaps without undoing newer changes.
  `afrotech:plan-merged` records the account they merged into.
- **Signed out:** sync runs only after sign-in leaves the `afrotech:signed-in`
  hint (todo 015 sets it), so signed-out visitors send no API requests at all.
  A 401 clears the hint.
- **Tested** against a local D1 with a test session and two browser contexts:
  - a pre-sign-in star merged on first sync
  - stars and unstars flowed both ways
  - an offline star synced on reconnect
  - signed-out visits made zero API calls
  - a missing `Origin` got 403 and a bad event id 400
