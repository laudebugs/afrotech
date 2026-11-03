# Research: a hand-drawn, inline SVG makes the best convention center map

The map has three jobs: show which rooms have events now, list a room's
sessions when you tap it, and show roughly where you are. A converted PDF
handles none of these well, because it arrives as thousands of unnamed shapes.
This note recommends drawing our own simple SVG of each level, placing it
inline in the page, styling rooms with CSS and adding pan and zoom with
`@panzoom/panzoom`.

## Almost every official session needs a place on the floor plan

Of 259 official sessions, 233 happen in the George R. Brown Convention Center
(GRB) or the Marriott Marquis next door. The schedule names 27 places:

| Area | Places (number of sessions) |
|------|-----------------------------|
| Exhibit Hall E, level 1 | Main Stage (12), Exhibit Hall E (19) |
| Exhibit Halls C and D, level 1 | Product & Innovation Stage (23) |
| Expo Hall | Expo Hall (4), The Yard (6), Book Nook (5), Authors Pavilion (24), Smart Cities Pavilion (9), Founders Pavilion (2), HealthStack Pavilion (1) |
| Meeting rooms | 310 (8), 320 (28) |
| Grand Ballroom | A (22), C (20) |
| Lounges and lobby | Registration in the Grand Lobby (5), Executive Lounge (5), Coca-Cola Lounge (5), Connect Lounge (1), Avenida Balcony (8) |
| Marriott Marquis | HealthStack General Session (18), HealthStack Seminar Room (8) |
| Outdoors | Discovery Green (1), The Grove (2) |
| No fixed room | Private (10), Partner Events (6), Naming Rights Events (4), Blavity House Party Events (3) |

Side events differ. Only 8 of the 174 take place in the GRB; the rest spread
across 123 addresses in Houston. So side events belong on a city map, and the
floor plan serves the official sessions.

## Drawing our own plan beats converting the GRB's PDFs

The GRB publishes [floor-plan PDFs](https://grbhouston.com/planners/floor-plans)
for each level, which leaves two ways to get an SVG:

1. **Convert a PDF** with `pdf2svg` or Inkscape. Conversion is fast, but the
   output holds thousands of unnamed paths, loads slowly on phones and
   republishes the GRB's artwork.
2. **Draw a simple plan by hand** (recommended), using the PDF as a guide and
   the [dimensions page](https://www.grbhouston.com/planners/dimensions-capacities/)
   to keep rooms in proportion. Rectangles and polygons stand for halls, rooms
   and lobbies. The file stays under 30 KB, every shape gets a meaningful id,
   and the drawing is ours.

The hand-drawn set needs one SVG for Level 1 (exhibit halls and the Grand
Lobby) and one for Level 3 (the Grand Ballroom and meeting rooms), plus small
insets for the Marriott Marquis and Discovery Green. The PDFs will confirm which
level holds each meeting room.

## Named shapes keep the drawing and the schedule separate

Each SVG uses three layers:

```svg
<svg viewBox="0 0 1200 600" role="group" aria-label="GRB level 1">
  <g id="layer-base">    <!-- walls, outline and labels -->
  <g id="layer-areas">   <!-- one shape per place in the schedule -->
    <path id="area-exhibit-hall-e" data-area="exhibit-hall-e" ... />
  </g>
  <g id="layer-pins">    <!-- "you are here" and event counts -->
</svg>
```

Four rules follow from that structure:

- **Stable ids.** Each place gets an id such as `area-meeting-room-320`.
  `data/venues.json` maps each schedule location to an id, a level and a pin
  point, so a schedule change never means editing the drawing.
- **Inline SVG.** An Astro component writes the SVG into the page, which saves
  a request and lets CSS style it.
- **State through CSS classes.** A small script adds `.has-events`, `.live`,
  `.in-my-plan` or `.selected` to each area. Colours come from the design
  tokens, so dark mode needs no second drawing.
- **Text labels.** Labels stay as SVG `<text>` so they scale, and small labels
  hide when zoomed out.

## `@panzoom/panzoom` handles pinch and zoom best on phones

| Option | Assessment |
|--------|------------|
| [`@panzoom/panzoom`](https://www.npmjs.com/package/@panzoom/panzoom) 4.6 | Works on any element, handles pinch and wheel, and limits zoom. **Recommended.** |
| [`svg-pan-zoom`](https://github.com/bumbu/svg-pan-zoom) 3.6 | Built for SVG and mature, but older and weaker on touch. |
| [`svg-toolbelt`](https://cdn.jsdelivr.net/npm/svg-toolbelt@0.7.0/README.md) | Adds keyboard and screen-reader support, but the project is young. |
| Changing the `viewBox` by hand | Needs no library, but pinch gestures take real work. Fallback only. |

Zoom buttons sit beside the map for anyone who can't pinch. Opening an event
from the schedule zooms the map to its room.

## Every map view needs a keyboard path and a list

Each area takes keyboard focus (`tabindex="0"`, `role="button"`) and carries a
label such as "Meeting Room 320, 2 events now". Enter or Space opens its list
of sessions. Beside the map, a plain list of "rooms with events now" gives the
same information without the map. Live rooms also show a pulsing dot and a
count, so colour never carries meaning alone; the pulse stops for anyone who
has turned on reduced motion.

## Indoors, location narrows you to one end of the building

The browser's Geolocation API (`navigator.geolocation.watchPosition`) returns
latitude, longitude and an accuracy radius, but only on HTTPS pages. Indoors,
that radius often grows to 20–100 m, and the API never reports a floor. Because
the GRB stretches roughly half a kilometre, the site can usually tell which end
of the building you're at, but not which room. Five design choices follow:

1. **Honest accuracy.** The map always draws the accuracy circle.
2. **Placing you on the SVG.** Three building corners from OpenStreetMap, each
   matched to its SVG coordinates, define an affine transform from latitude and
   longitude to x and y. The code fits in a dozen lines.
3. **Manual override.** An "I'm at…" picker lets you tap your room. The choice
   lasts 15 minutes and beats GPS indoors.
4. **Ranking nearby events.** Inside the GRB, straight-line distance on the
   plan plus a penalty for changing level. A walking graph would add little.
5. **Side events.** Great-circle (haversine) distance from you to each venue,
   shown on a [MapLibre GL](https://maplibre.org/) map with OpenFreeMap tiles.

The site asks for location only when you tap "Near me", and your position never
leaves your device.

## Recommendation

Draw an inline SVG for each level by hand, and map schedule places to its
shapes through `data/venues.json`. CSS classes set each room's state, and
`@panzoom/panzoom` handles pan and zoom. Three control points place you on the
plan, with an "I'm at…" override for indoors. For the city, MapLibre and
OpenFreeMap show the side events.
