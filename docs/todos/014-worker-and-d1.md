# 014 — Worker and D1 skeleton

**Status:** waiting on you · **Plan:** [Plan 0002](../plans/0002-google-sign-in.md) · **Depends on:** —

## Goal

Add a small Worker beside the static site, with a D1 database, so later todos have an API to build on.

## Done when

- [ ] `worker/index.ts` handles `/api/*` through `run_worker_first`; everything else stays static
- [ ] D1 binding and migrations in `worker/migrations/` (users, sessions, plan_items)
- [ ] `GET /api/me` returns signed out
- [ ] Local development with `wrangler dev` and a local D1
- [ ] Cloudflare deploy command runs migrations before `wrangler deploy`

## Notes

**Waiting on you:** the D1 database ID (see plan 0002, "Two setup steps"). A D1 binding without a real ID breaks Cloudflare deploys, so this can't merge before then.
