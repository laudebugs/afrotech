# Research: interactive SVG map of the convention center

Goal: one map that shows which rooms have events now, lets you tap a room to see
its sessions, and shows roughly where you are.

## What needs to be on the map

Almost every official session is at the George R. Brown Convention Center (GRB)
or the Marriott Marquis next door. The schedule uses 27 location strings:

| Area | Locations (sessions) |
|------|----------------------|
| Exhibit Hall E, level 1 | Main Stage (12), Exhibit Hall E (19) |
| Exhibit Hall C & D, level 1 | Product & Innovation Stage (23) |
| Expo Hall | Expo Hall (4), The Yard (6), Book Nook (5), Authors Pavilion (24), Smart Cities Pavilion (9), Founders Pavilion (2), HealthStack Pavilion (1) |
| Meeting rooms | 310 (8), 320 (28) |
| Grand Ballroom, level 3 | A (22), C (20) |
| Lounges & lobby | Registration – Grand Lobby (5), Executive Lounge (5), Coca-Cola Lounge (5), Connect Lounge (1), Balconies C – Avenida Balcony (8) |
| Marriott Marquis | HealthStack General Session (18), HealthStack Seminar Room (8) |
| Outside | Discovery Green (1), The Grove (2) |
| No fixed room | Private (10), Partner Events (6), Naming Rights Events (4), Blavity House Party Events (3) |

Side events: 170, with 122 distinct addresses across Houston. Only ~8 are inside
the GRB. These belong on a city map, not the floor plan.

## Where the floor plan comes from

The GRB publishes [floor-plan PDFs](https://grbhouston.com/planners/floor-plans)
for each level. Options:

1. **Convert the PDF to SVG** (`pdf2svg`, Inkscape). Fast, but the output is
   thousands of unnamed paths, heavy on mobile, and it's their artwork.
2. **Trace a simplified plan by hand** (recommended). Rectangles and polygons
   for halls, rooms and lobbies, using the PDF as a guide and the
   [dimensions page](https://www.grbhouston.com/planners/dimensions-capacities/)
   for proportion. Small file (<30 KB), every shape has a meaningful id, and it's
   our own drawing.

One SVG per level: **Level 1** (exhibit halls, Grand Lobby) and **Level 3**
(Grand Ballroom, meeting rooms 3xx — confirm room levels against the PDF), plus a
simple inset for the **Marriott Marquis** and **Discovery Green**.

## SVG structure

```svg
<svg viewBox="0 0 1200 600" role="group" aria-label="GRB level 1">
  <g id="layer-base">          <!-- walls, outline, labels: decoration -->
  <g id="layer-areas">         <!-- one shape per bookable place -->
    <path id="area-exhibit-hall-e" data-area="exhibit-hall-e" ... />
  </g>
  <g id="layer-pins">          <!-- "you are here", event counts -->
</svg>
```

- Shapes get **stable ids** (`area-meeting-room-320`). A mapping file,
  `data/venues.json`, maps each schedule location string to an area id, a level,
  and a point to pin. Schedule data and drawing stay separate.
- **Inline the SVG** in an Astro component (no extra request, CSS can style it).
- **State via CSS classes** set by a small script: `.has-events`, `.live`,
  `.in-my-plan`, `.selected`. Colors come from the design tokens, so dark mode
  works without editing the SVG.
- Labels are real `<text>` so they scale; hide small labels below a zoom level.

## Pan and zoom

| Option | Notes |
|--------|-------|
| [`@panzoom/panzoom`](https://www.npmjs.com/package/@panzoom/panzoom) 4.6.x | Framework-free, handles pinch and wheel, min/max bounds. **Recommended.** |
| [`svg-pan-zoom`](https://github.com/bumbu/svg-pan-zoom) 3.6.x | SVG-specific and mature, but older and less touch-friendly. |
| [`svg-toolbelt`](https://cdn.jsdelivr.net/npm/svg-toolbelt@0.7.0/README.md) | Built-in keyboard and screen-reader support; young project. |
| Hand-rolled `viewBox` changes | No dependency; pinch handling is fiddly. Fallback if a library fights us. |

Also: buttons for zoom in/out/reset (not everyone can pinch), and "zoom to room"
when you open a session from the schedule.

## Accessibility

- Each area is focusable (`tabindex="0"`, `role="button"`, `aria-label="Meeting
  Room 320, 2 events now"`). Enter/Space opens its sheet.
- Every map view has a **list alternative** ("Rooms with events now"), so the
  map is never the only way in.
- Don't rely on color alone: live rooms also get a pulsing dot and a count badge
  (pulse off under `prefers-reduced-motion`).

## "Where am I" and "what's nearby"

The browser Geolocation API (`navigator.geolocation.watchPosition`, HTTPS only)
gives latitude/longitude with an accuracy radius.

- **Indoors, GPS is rough**: expect 20–100 m of error, and no floor. The GRB is
  roughly half a kilometre long, so we can usually tell *which end* of the
  building you're at, not which room. The UI must show an accuracy circle and
  never claim more precision than it has.
- **Putting you on the SVG**: pick 3 known points (building corners) from
  OpenStreetMap, note their SVG coordinates, and solve an affine transform
  (lat/lng → x/y). A dozen lines of code, no GIS library.
- **Manual override**: "I'm at…" picker (tap a room) beats GPS indoors. Remember
  it for 15 minutes.
- **Nearby ranking** (inside the GRB): straight-line distance on the plan, plus a
  penalty for a level change. Good enough; a walking graph is overkill.
- **Side events**: haversine distance from you to each geocoded venue, shown on
  a [MapLibre GL](https://maplibre.org/) city map with OpenFreeMap tiles.
- Location never leaves the device. Ask only when the user taps "Near me".

## Decision

Hand-traced, inline SVG per level · `data/venues.json` mapping · CSS state
classes · `@panzoom/panzoom` · affine transform from 3 control points ·
manual "I'm at" override · MapLibre + OpenFreeMap for the city.
