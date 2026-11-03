# 004 — Schedule pages with filters and search

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002, 003

## Goal

Browse all official sessions and side events by day.

## Done when

- [x] `/schedule/[day]` for Nov 1–7, grouped by start time with sticky headers
- [x] Filters: official/side, track, free, founder/investor picks (chips, kept in the URL)
- [x] Search across title, speakers, host
- [x] `/event/[id]` detail page; tapping a row opens it as a bottom sheet on mobile
- [x] "Add to calendar" .ics for a single event
- [x] Credits to each source in the footer

## Notes

- **Routes:** `/schedule/` sends you to today's page during the week and lists
  the days otherwise. Day pages live at `/schedule/2026-11-04/`, event pages
  at `/event/<id>/`, and calendar files at `/event/<id>.ics`.
- **Filters:** Everything, Official, Side events, Free, Founder picks, a
  track menu and search, all kept in the URL (`?kind=side&free=1&q=…`).
  Switching days keeps them.
- **Bottom sheet:** tapping an event fetches its page and shows the details in
  the sheet on every screen size, not only on phones. The link still works if
  scripts fail.
- **Shared styles:** event-detail styles live in
  `src/styles/event-detail.css`, because Astro only ships a component's CSS on
  pages that render it.
- **Hour headers** come from each event's start time, so a 4-hour workshop sits
  under the hour it starts.
