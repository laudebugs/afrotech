# 034 — Merge event pages into events

**Status:** todo · **Plan:** [Plan 0008](../plans/0008-event-pages-and-maps-apps.md) · **Depends on:** 033

## Goal

Fill empty fields from the event pages, list disagreements for review, and run it in the refresh Action.

## Done when

- [ ] `build_events.py` fills empty address, end, description and price, and credits the page
- [ ] Disagreements listed in `schedule/side-events.md`
- [ ] The refresh Action runs `enrich_events.py` before the build
