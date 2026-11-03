# 007 — Trace GRB floor plan SVGs + venues mapping

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** 002

## Goal

Draw our own simplified convention center plan, per the [SVG research](../research/svg-floor-plan.md).

## Done when

- [x] `src/assets/maps/grb-level-1.svg` and `grb-level-3.svg`, plus Marriott and Discovery Green insets
- [x] Every location in the schedule maps to an area id or is marked off-map
- [x] Shapes have stable ids, labels are `<text>`, no inline colours (CSS only)
- [x] Three control points (lat/lng ↔ x/y) recorded in `data/venues.json`
- [x] Each SVG under 30 KB

## Notes

Use the GRB PDFs as reference only; don't ship them.

Built on November 3:

- **Source:** the GRB's 2024 planner brochure has a whole-floor map for each of
  Levels 1–3; the per-room PDFs only show single rooms. I traced the brochure
  maps to scale using its listed dimensions (Halls A–E are 1,560 ft end to end).
- **Script:** `scripts/build_floor_plan.py` holds the traced shapes as one table
  in feet and writes `src/assets/maps/grb-level-1.svg`, `-2.svg` and `-3.svg`
  (3–8 KB each) plus `data/floor-plan.json`. Edit the table and re-run it,
  rather than editing the SVGs.
- **Frame:** all levels share it, north up: x runs 0 (Avenida side) to 470 ft
  (loading dock), and y runs 0 (north, Hall A) to 1,568 ft (south, Hall E).
- **Level 2 added:** the Avenida Balcony is on the mezzanine, so a Level 2 map
  joins the planned 1 and 3. The Marriott, Discovery Green, The Grove and the
  Hilton appear as insets across Avenida de las Americas on Level 1.
- **Control points:** three building corners from OpenStreetMap (way 44129959)
  live in `data/floor-plan.json`, not `data/venues.json`, because they belong
  to the map rather than to a venue.
- **Location mapping:** every official location now has an area or a note in
  `data/venues.json`:
  - **On the map:** Hall E and the Main Stage, Halls C–D, the Grand Lobby, the
    Avenida Balcony, Ballrooms A and C, Meeting Rooms 310 and 320, the
    Marriott, Discovery Green and The Grove.
  - **Marked approximate:** the HealthStack rooms inside the Marriott and The
    Grove inside Discovery Green.
  - **A note instead of a spot:** the expo areas (The Yard, Book Nook, the
    pavilions) and the lounges. AfroTech publishes no expo map, so the site
    says "In the exhibit halls; AfroTech hasn't published where" rather than
    guess.
  - **Off-map:** Private, Partner Events, Naming Rights and Blavity House Party.
- **Guards:** `build_events.py` fails if a venue points at an area the map
  doesn't have, and warns (without failing) about new on-site venues with no
  area or note yet.

