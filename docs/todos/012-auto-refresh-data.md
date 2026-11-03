# 012 — Scheduled data refresh

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002

## Goal

Keep the schedule current during the conference without manual runs.

## Done when

- [x] GitHub Action runs the update scripts every 2 hours, Nov 1–7
- [ ] Commits only when data changed; Cloudflare Workers Builds deploys the commit (built, but not yet seen running)
- [x] Fails loudly (and keeps the last good data) if a source breaks

## Notes

- **Workflow:** `.github/workflows/refresh-data.yml` runs at 17 minutes past
  every second hour, Nov 1–8 UTC, which covers Nov 1–7 in Houston. A first job
  lets scheduled runs through only in 2026, because cron has no year. Running
  it by hand from the Actions tab always goes ahead.
- **Independent sources:** the two fetches run separately, so a broken official
  schedule doesn't stop a side-events refresh, or the reverse. If either fails,
  the run still commits what worked, then fails at the end so GitHub sends an
  email. That email goes to whoever last edited the schedule line.
- **Partial data:** a fetch stops without writing if afrotech.guide or the
  community sheet returns nothing, or if either script's event count drops
  more than 20% below the committed data. Run with `ALLOW_SHRINK=1` to accept
  a real drop.
- **Commit, then build:** the job commits, rebases on `main` (a note may have
  landed meanwhile), builds that exact tree, and only then pushes. Data that
  breaks the build never reaches `main`.
- **Always on main:** the job checks out `main` and pushes `HEAD:main`.
  Scheduled runs still read the workflow file from the default branch, which
  is now `main`.
- **No empty commits:** running both update scripts twice in a row produces no
  diff, so the workflow commits only when a source really changed.
- **Not run yet:** the second checklist item stays open until a run commits new
  data and Cloudflare deploys it. Start one by hand to check.
