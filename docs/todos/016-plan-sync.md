# 016 — Sync My plan across devices

**Status:** todo · **Plan:** [Plan 0002](../plans/0002-google-sign-in.md) · **Depends on:** 015

## Goal

Keep stars in step across a signed-in person's devices.

## Done when

- [ ] Local change log with timestamps (`afrotech:plan-changes`)
- [ ] `GET`/`POST /api/plan`: per-event latest change wins; unstars kept as `starred = 0`
- [ ] First sign-in merges local stars with the saved plan
- [ ] Syncs on load, a second after a change, and when the tab returns; offline changes wait
- [ ] Signed-out behaviour unchanged

## Notes

Stars only, the plan's recommended default; note drafts stay on the device.
