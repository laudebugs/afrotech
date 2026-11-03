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

# id, label, kind, x, y, width, height, extra options
# kinds: hall, stage, room, lobby, balcony, outside, hotel, corridor
LEVELS = {
    1: {
        "title": "Level 1 · exhibit halls and concourse",
        "view": (-430, -70, 920, 1700),
        "base": [
            ("outline", 0, 0, W, L),
            ("dock", 380, 0, 90, L),
        ],
        "labels": [
            ("Loading dock", 425, 784, {"rotate": 90, "size": 24}),
            ("Avenida de las Americas", -105, 400, {"rotate": -90, "size": 26}),
            ("N", 440, -30, {"size": 28}),
        ],
        "areas": [
            ("hall-a", "Hall A", "hall", 86, 0, 294, 325),
            ("hall-b", "Hall B", "hall", 86, 325, 294, 307),
            # AfroTech joins Halls C and D into one space (Product & Innovation Stage).
            ("halls-c-d", "Halls C–D", "stage", 86, 632, 294, 608),
            ("hall-e", "Hall E · Main Stage", "stage", 86, 1240, 294, 328),
            ("concourse", "Concourse", "corridor", 0, 0, 86, L, {"label": {"x": 43, "y": 420, "rotate": 90}}),
            ("grand-lobby", "Grand Lobby", "lobby", 0, 740, 86, 80),
            ("avenida-plaza", "Avenida Plaza", "outside", -60, 640, 60, 300),
            ("marriott", "Marriott Marquis", "hotel", -400, -20, 220, 320),
            ("discovery-green", "Discovery Green", "outside", -400, 680, 250, 432),
            ("the-grove", "The Grove", "outside", -390, 700, 110, 70, {"approximate": True}),
            ("hilton", "Hilton Americas", "hotel", -400, 1320, 220, 250),
        ],
    },
    2: {
        "title": "Level 2 · mezzanine and balconies",
        "view": (-430, -70, 920, 1700),
        "base": [
            ("outline", 0, 0, W, L),
            ("below", 86, 0, 384, L),
        ],
        "labels": [
            ("Exhibit halls below", 278, 784, {"rotate": 90, "size": 28}),
            ("Avenida de las Americas", -280, 784, {"rotate": -90, "size": 26}),
            ("Skybridge to Marriott", -200, 45, {"size": 20}),
            ("Skybridge to Hilton", -200, 1350, {"size": 20}),
            ("N", 440, -30, {"size": 28}),
        ],
        "bridges": [(-180, 73, 180), (-180, 1366, 180)],
        "areas": [
            ("mezzanine", "Mezzanine A–D", "corridor", 20, 30, 66, 1500),
            ("rusk-balcony", "Rusk Balcony", "balcony", 0, 85, 26, 50, {"label": {"x": -14, "y": 110, "anchor": "end", "size": 20}}),
            ("walker-balcony", "Walker Balcony", "balcony", 0, 330, 26, 92, {"label": {"x": -14, "y": 376, "anchor": "end", "size": 20}}),
            ("mckinney-balcony", "McKinney Balcony", "balcony", 0, 602, 26, 92, {"label": {"x": -14, "y": 648, "anchor": "end", "size": 20}}),
            ("avenida-balcony", "Avenida Balcony", "balcony", 0, 872, 26, 92, {"label": {"x": -14, "y": 918, "anchor": "end", "size": 20}}),
            ("lamar-balcony", "Lamar Balcony", "balcony", 0, 1143, 26, 92, {"label": {"x": -14, "y": 1189, "anchor": "end", "size": 20}}),
            ("polk-balcony", "Polk Balcony", "balcony", 0, 1470, 26, 56, {"label": {"x": -14, "y": 1498, "anchor": "end", "size": 20}}),
        ],
    },
    3: {
        "title": "Level 3 · ballroom and meeting rooms",
        "view": (-430, -70, 920, 1700),
        "base": [
            ("outline", 0, 0, W, L),
            ("dock", 424, 0, 46, L),
        ],
        "labels": [
            ("Avenida de las Americas", -280, 784, {"rotate": -90, "size": 26}),
            ("Skybridge to Hilton", -200, 1350, {"size": 20}),
            ("N", 440, -30, {"size": 28}),
        ],
        "bridges": [(-180, 1363, 180)],
        "areas": [
            ("hall-a3", "Hall A3", "hall", 93, 0, 331, 324),
            ("hall-b3", "Hall B3", "hall", 93, 324, 331, 258),
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


def label_el(text, x, y, size=22, rotate=0, cls="label"):
    transform = f' transform="rotate({rotate} {fmt(x)} {fmt(y)})"' if rotate else ""
    return (
        f'<text class="{cls}" x="{fmt(x)}" y="{fmt(y)}" font-size="{size}"'
        f' text-anchor="middle" dominant-baseline="middle"{transform}>{esc(text)}</text>'
    )


def area_label(label, x, y, w, h, place=None):
    """Fit a label inside its shape (rotated in tall, narrow shapes), or put it
    where `place` says, e.g. beside a shape too thin to hold text."""
    if place:
        anchor = place.get("anchor", "middle")
        rotate = place.get("rotate", 0)
        transform = f' transform="rotate({rotate} {fmt(place["x"])} {fmt(place["y"])})"' if rotate else ""
        return (
            f'<text class="area-label" x="{fmt(place["x"])}" y="{fmt(place["y"])}"'
            f' font-size="{place.get("size", 22)}" text-anchor="{anchor}" dominant-baseline="middle"'
            f"{transform}>{esc(label)}</text>"
        )
    cx, cy = x + w / 2, y + h / 2
    tall = h > w * 1.6
    room = (h if tall else w) / max(len(label), 3)
    size = max(12, min(30, room * 1.6))
    return label_el(label, cx, cy, round(size), 90 if tall else 0, "area-label")


def svg_for(level, spec):
    vx, vy, vw, vh = spec["view"]
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
    for area in spec["areas"]:
        area_id, label, kind, x, y, w, h = area[:7]
        opts = area[7] if len(area) > 7 else {}
        approx = ' data-approximate="true"' if opts.get("approximate") else ""
        out.append(
            f'<g id="area-{area_id}" class="area area--{kind}" data-area="{area_id}"{approx}>'
            f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}"/>'
            f"{area_label(label, x, y, w, h, opts.get('label'))}</g>"
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
        for area in spec["areas"]:
            area_id, label, kind, x, y, w, h = area[:7]
            opts = area[7] if len(area) > 7 else {}
            assert area_id not in areas, f"duplicate area id {area_id}"
            areas[area_id] = {
                "level": level,
                "label": label,
                "kind": kind,
                "center": [round(x + w / 2), round(y + h / 2)],
                "approximate": bool(opts.get("approximate")),
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
