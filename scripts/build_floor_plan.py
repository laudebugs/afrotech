#!/usr/bin/env python3
"""Draw our own simplified George R. Brown Convention Center map.

Writes src/assets/maps/grb-level-{1,2,3}.svg and data/floor-plan.json.

Every shape below was traced by eye from the GRB's 2024 planner brochure
(levels one to three) and its per-room floor-plan PDFs, then simplified to
rectangles. The PDFs themselves are reference only and never shipped.

Coordinates are feet in one frame shared by all levels, with north up:
  x: 0 at the building's west wall (Avenida de las Americas) → 470 at the east
     wall (loading dock). Negative x is across the street.
  y: 0 at the north end (Hall A) → 1568 at the south end (Hall E).
The building's real corners come from OpenStreetMap (way 44129959), so a
latitude/longitude can be placed on any level with an affine transform.

Shapes are classed by kind; colours come from CSS (design tokens), never here.
Areas marked approximate are AfroTech set-ups whose exact spot inside the
building isn't published.
"""
import json
from collections import namedtuple
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src/assets/maps"

W, L = 470, 1568  # building width (west→east) and length (north→south), feet

# Real-world corners of the building (OpenStreetMap way 44129959), matched to
# map coordinates. Three points define the affine transform.
CONTROL_POINTS = [
    {"name": "north-west corner", "lat": 29.754256, "lng": -95.357061, "x": 0, "y": 0},
    {"name": "north-east corner", "lat": 29.753528, "lng": -95.355840, "x": W, "y": 0},
    {"name": "south-west corner", "lat": 29.750717, "lng": -95.359862, "x": 0, "y": L},
]

# Every level uses the same view box (feet) and north arrow.
VIEW = (-430, -70, 920, 1700)
NORTH = ("N", 440, -30, {"size": 28})

# One tappable place on the map. kind: hall, stage, room, lobby, balcony,
# outside, hotel or corridor; keep these in step with AreaKind in
# src/lib/types.ts. opts: approximate, and label placement.
Area = namedtuple("Area", "id label kind x y w h opts", defaults=[None])

# Areas are listed as Area(...) fields; later shapes paint (and take taps) on
# top of earlier ones, so a place inside another (The Grove inside Discovery
# Green) comes after it.
LEVELS = {
    1: {
        "title": "Level 1 · exhibit halls and concourse",
        "base": [
            ("outline", 0, 0, W, L),
            ("dock", 380, 0, 90, L),
        ],
        "labels": [
            ("Loading dock", 425, 784, {"rotate": 90, "size": 24}),
            ("Avenida de las Americas", -100, 400, {"rotate": -90, "size": 26}),
            NORTH,
        ],
        "areas": [
            ("hall-a", "Hall A", "hall", 86, 0, 294, 325),
            ("hall-b", "Hall B", "hall", 86, 325, 294, 307),
            # AfroTech joins Halls C and D into one space (Product & Innovation Stage).
            ("halls-c-d", "Halls C–D", "stage", 86, 632, 294, 608),
            ("hall-e", "Hall E · Main Stage", "stage", 86, 1240, 294, 328),
            ("concourse-north", "Concourse", "corridor", 0, 0, 86, 740, {"label": {"x": 43, "y": 420, "rotate": 90}}),
            ("grand-lobby", "Grand Lobby", "lobby", 0, 740, 86, 80),
            ("concourse-south", "Concourse", "corridor", 0, 820, 86, L - 820, {"label": {"x": 43, "y": 1190, "rotate": 90}}),
            ("avenida-plaza", "Avenida Plaza", "outside", -60, 640, 60, 300),
            ("marriott", "Marriott Marquis", "hotel", -400, -20, 220, 320),
            # The park runs from McKinney St (north) to Lamar St (south).
            ("discovery-green", "Discovery Green", "outside", -420, 650, 290, 540),
            # The Grove (1611 Lamar St) sits on the park's south edge, near Avenida.
            ("the-grove", "The Grove", "outside", -240, 1105, 100, 70, {"approximate": True}),
            ("hilton", "Hilton Americas", "hotel", -400, 1320, 220, 250),
        ],
    },
    2: {
        "title": "Level 2 · mezzanine and balconies",
        "base": [
            ("outline", 0, 0, W, L),
            ("below", 86, 0, 384, L),
        ],
        "labels": [
            ("Exhibit halls below", 278, 784, {"rotate": 90, "size": 28}),
            ("Avenida de las Americas", -280, 784, {"rotate": -90, "size": 26}),
            ("Skybridge to Marriott", -200, 45, {"size": 20}),
            ("Skybridge to Hilton", -200, 1350, {"size": 20}),
            NORTH,
        ],
        "bridges": [(-180, 73, 180), (-180, 1366, 180)],
        "areas": [
            ("mezzanine", "Mezzanine A–D", "corridor", 40, 30, 60, 1500),
            ("rusk-balcony", "Rusk Balcony", "balcony", 0, 85, 40, 50, {"label": {"x": -14, "y": 110, "anchor": "end", "size": 20}}),
            ("walker-balcony", "Walker Balcony", "balcony", 0, 330, 40, 92, {"label": {"x": -14, "y": 376, "anchor": "end", "size": 20}}),
            ("mckinney-balcony", "McKinney Balcony", "balcony", 0, 602, 40, 92, {"label": {"x": -14, "y": 648, "anchor": "end", "size": 20}}),
            ("avenida-balcony", "Avenida Balcony", "balcony", 0, 872, 40, 92, {"label": {"x": -14, "y": 918, "anchor": "end", "size": 20}}),
            ("lamar-balcony", "Lamar Balcony", "balcony", 0, 1143, 40, 92, {"label": {"x": -14, "y": 1189, "anchor": "end", "size": 20}}),
            ("polk-balcony", "Polk Balcony", "balcony", 0, 1470, 40, 56, {"label": {"x": -14, "y": 1498, "anchor": "end", "size": 20}}),
        ],
    },
    3: {
        "title": "Level 3 · ballroom and meeting rooms",
        "base": [
            ("outline", 0, 0, W, L),
            ("dock", 424, 0, 46, L),
        ],
        "labels": [
            ("Avenida de las Americas", -280, 784, {"rotate": -90, "size": 26}),
            ("Skybridge to Hilton", -200, 1350, {"size": 20}),
            NORTH,
        ],
        "bridges": [(-180, 1363, 180)],
        "areas": [
            ("hall-a3", "Hall A3", "hall", 20, 0, 404, 324),
            ("hall-b3", "Hall B3", "hall", 20, 324, 404, 258),
            ("ballroom-a", "Ballroom A", "stage", 186, 691, 122, 92),
            ("ballroom-b", "Ballroom B", "room", 186, 783, 122, 93),
            ("ballroom-c", "Ballroom C", "stage", 186, 876, 122, 93),
            ("ballroom-prefunction", "Prefunction", "corridor", 95, 783, 79, 90),
            ("room-310", "310", "room", 95, 691, 81, 79),
            ("room-320", "320", "room", 95, 887, 81, 82),
            ("room-322", "322", "room", 311, 917, 60, 52),
            ("general-assembly", "General Assembly", "stage", 152, 999, 103, 212),
            ("room-330", "330", "room", 95, 979, 54, 66),
            ("room-340", "340", "room", 95, 1151, 54, 66),
            ("room-332", "332", "room", 284, 979, 90, 73),
            ("room-342", "342", "room", 284, 1144, 90, 73),
            ("prefunction", "Prefunction", "corridor", 52, 582, 41, 986),
        ]
        # The 350–382 block: four columns along the building (350s, 360s, 370s,
        # 380s), three rows from the Avenida side inward (x0, x1, x2 rooms).
        + [
            (f"room-{350 + 10 * col + row}", str(350 + 10 * col + row), "room", x, y, w, length)
            for col, (y, length) in enumerate([(1228, 75), (1320, 76), (1409, 80), (1502, 53)])
            for row, (x, w) in enumerate([(95, 81), (186, 87), (284, 90)])
        ],
    },
}


def fmt(n):
    return f"{n:g}"


def esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def label_el(text, x, y, size=22, rotate=0, cls="label", anchor="middle"):
    transform = f' transform="rotate({rotate} {fmt(x)} {fmt(y)})"' if rotate else ""
    return (
        f'<text class="{cls}" x="{fmt(x)}" y="{fmt(y)}" font-size="{size}"'
        f' text-anchor="{anchor}" dominant-baseline="middle"{transform}>{esc(text)}</text>'
    )


def area_label(label, x, y, w, h, place=None):
    """Fit a label inside its shape (rotated in tall, narrow shapes), or put it
    where `place` says, e.g. beside a shape too thin to hold text."""
    if place:
        return label_el(
            label, place["x"], place["y"], place.get("size", 22), place.get("rotate", 0),
            "area-label", place.get("anchor", "middle"),
        )
    cx, cy = x + w / 2, y + h / 2
    tall = h > w * 1.6
    room = (h if tall else w) / max(len(label), 3)
    size = max(12, min(30, room * 1.6))
    # Labels too small to read at full view hide until the map is zoomed in.
    cls = "area-label small" if size < 18 else "area-label"
    return label_el(label, cx, cy, round(size), 90 if tall else 0, cls)


def areas_of(spec):
    return [Area(*a) for a in spec["areas"]]


def svg_for(level, spec):
    vx, vy, vw, vh = VIEW
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx} {vy} {vw} {vh}"'
        f' role="group" aria-label="George R. Brown Convention Center, {esc(spec["title"])}"'
        f' data-level="{level}">',
        '<g id="layer-base" aria-hidden="true">',
    ]
    for cls, x, y, w, h in spec["base"]:
        out.append(f'<rect class="base-{cls}" x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}"/>')
    for x, y, w in spec.get("bridges", []):
        out.append(f'<rect class="base-bridge" x="{fmt(x)}" y="{fmt(y - 8)}" width="{fmt(w)}" height="16"/>')
    for text, x, y, opts in spec["labels"]:
        out.append(label_el(text, x, y, opts.get("size", 22), opts.get("rotate", 0)))
    out.append("</g>")
    out.append('<g id="layer-areas">')
    for a in areas_of(spec):
        opts = a.opts or {}
        approx = ' data-approximate="true"' if opts.get("approximate") else ""
        # Focusable with a spoken name, per docs/research/svg-floor-plan.md;
        # the map page (todo 008) adds live counts to the label.
        out.append(
            f'<g id="area-{a.id}" class="area area--{a.kind}" data-area="{a.id}"{approx}'
            f' tabindex="0" role="button" aria-label="{esc(a.label)}">'
            f'<rect x="{fmt(a.x)}" y="{fmt(a.y)}" width="{fmt(a.w)}" height="{fmt(a.h)}"/>'
            f"{area_label(a.label, a.x, a.y, a.w, a.h, opts.get('label'))}</g>"
        )
    out.append("</g>")
    out.append('<g id="layer-pins"></g>')
    out.append("</svg>")
    return "\n".join(out) + "\n"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    areas = {}
    for level, spec in LEVELS.items():
        path = OUT_DIR / f"grb-level-{level}.svg"
        text = svg_for(level, spec)
        path.write_text(text, encoding="utf-8")
        size = len(text.encode())
        assert size < 30_000, f"{path.name} is {size} bytes; keep it under 30 KB"
        for a in areas_of(spec):
            assert a.id not in areas, f"duplicate area id {a.id}"
            areas[a.id] = {
                "level": level,
                "label": a.label,
                "kind": a.kind,
                "center": [round(a.x + a.w / 2), round(a.y + a.h / 2)],
                "approximate": bool((a.opts or {}).get("approximate")),
            }
        print(f"Wrote {path.relative_to(ROOT)} ({size:,} bytes, {len(spec['areas'])} areas)")

    plan = {
        "units": "feet",
        "frame": {"width": W, "length": L, "note": "x west→east, y north→south, shared by all levels"},
        "controlPoints": CONTROL_POINTS,
        "levels": {str(k): {"title": v["title"], "svg": f"src/assets/maps/grb-level-{k}.svg"} for k, v in LEVELS.items()},
        "areas": areas,
    }
    (ROOT / "data/floor-plan.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote data/floor-plan.json ({len(areas)} areas)")


if __name__ == "__main__":
    main()
