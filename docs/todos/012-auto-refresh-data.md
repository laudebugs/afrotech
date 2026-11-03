# 012 — Scheduled data refresh

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002

## Goal

Keep the schedule current during the conference without manual runs.

## Done when

- [x] GitHub Action runs the update scripts every 2 hours, Nov 1–7
- [x] Commits only when data changed; Cloudflare Workers Builds deploys the commit
- [x] Fails loudly (and keeps the last good data) if a source breaks

## Notes

- **Workflow:** `.github/workflows/refresh-data.yml` runs at 17 minutes past every
  second hour, Nov 1–7 (UTC). It can also be started by hand from the Actions
  tab ("Run workflow").
- **Before committing:** it builds the site (`npm ci && npm run build`), so data
  that breaks the build never reaches `main`. A failed source or build fails
  the run, GitHub emails the repo owner, and the last good data stays.
- **Always on main:** the job checks out `main` and pushes `HEAD:main` after
  rebasing, so it works whichever branch is the repo's default and survives a
  note pushed mid-run.
- **Deploys:** commits come from `github-actions[bot]`. Cloudflare Workers Builds
  watches the repo through its GitHub app, so these pushes deploy like any
  other.
- **No empty commits:** running both update scripts twice in a row produces no
  diff, so the workflow commits only when a source really changed.
- **Not run yet:** the first scheduled run, or a manual one, is the real test.
