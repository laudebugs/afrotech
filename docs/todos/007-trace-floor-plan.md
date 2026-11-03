# 007 — Trace GRB floor plan SVGs + venues mapping

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002

## Goal

Draw our own simplified convention center plan, per the [SVG research](../research/svg-floor-plan.md).

## Done when

- [ ] `src/assets/maps/grb-level-1.svg` and `grb-level-3.svg`, plus Marriott and Discovery Green insets
- [ ] Every location in the schedule maps to an area id or is marked off-map
- [ ] Shapes have stable ids, labels are `<text>`, no inline colours (CSS only)
- [ ] Three control points (lat/lng ↔ x/y) recorded in `data/venues.json`
- [ ] Each SVG under 30 KB

## Notes

Use the GRB PDFs as reference only; don't ship them.
