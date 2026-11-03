# 014 — Worker and D1 skeleton

**Status:** done · **Plan:** [Plan 0002](../plans/0002-google-sign-in.md) · **Depends on:** —

## Goal

Add a small Worker beside the static site, with a D1 database, so later todos have an API to build on.

## Done when

- [x] `worker/index.ts` handles `/api/*` through `run_worker_first`; everything else stays static
- [x] D1 binding and migrations in `worker/migrations/` (users, sessions, plan_items)
- [x] `GET /api/me` returns signed out
- [x] Local development with `wrangler dev` and a local D1
- [ ] Cloudflare deploy command runs migrations before `wrangler deploy` (you change this in the dashboard; see the README's Cloudflare setup)

## Notes

Built on November 3 with database ID `45965e56-ece8-462d-b699-164835ebeca3`.

- **Worker:** `worker/index.ts` routes `/api/*` through a small table, starting
  with `GET /api/me`. Responses are JSON, never cached, and any database error
  becomes a 503 rather than a crash. `worker/session.ts` reads the
  `__Host-session` cookie and only queries D1 when one is present, so signed-out
  visits never touch the database.
- **Migrations:** `worker/migrations/0001_init.sql` creates `users`, `sessions`
  (token hashes only) and `plan_items` (with `starred = 0` rows so unstars sync).
- **Types:** the Worker has its own `worker/tsconfig.json` with
  `@cloudflare/workers-types` (pinned to a release more than two weeks old), and
  `npm run build` type-checks it.
- **Tested locally:** with a migrated local D1 under `wrangler dev`:
  - signed-out `/api/me` returns `{"signedIn":false}` with `no-store`
  - POST returns 405 and an unknown path 404
  - pages and the 404 page are still served statically
  - a test session signs in; a wrong token or deleted user signs out
- **Previews:** branch preview builds share the live database. They can't sign
  anyone in (Google only accepts the production origin), so they can't write
  to it, and migrations run only in the production deploy command.
- **Waiting on you:** changing the production deploy command (README, Cloudflare
  setup).
