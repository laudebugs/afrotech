# 012 — Scheduled data refresh

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 001, 002

## Goal

Keep the schedule current during the conference without manual runs.

## Done when

- [ ] GitHub Action runs the update scripts every 2 hours, Nov 1–7
- [ ] Commits only when data changed, then calls the deploy workflow (commits from the built-in token start no other workflows)
- [ ] Fails loudly (and keeps the last good data) if a source breaks
