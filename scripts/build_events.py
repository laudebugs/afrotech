#!/usr/bin/env python3
"""Turn the merged schedules into the site's event format.

Reads data/sessions.json (official) and data/side-events.csv (side events) and
writes data/events/official.json, data/events/side.json and data/venues.json.
The shape matches the `Event` type in src/lib/types.ts.

data/venues.json is partly hand-maintained: this script only adds places it
hasn't seen and refreshes their label, kind and address. Fields added later
by hand or by other scripts (level, areaId, lat, lng) are kept.
"""
import csv
import hashlib
import json
import re
import sys
from datetime import date, datetime, timedelta

from common import ROOT, TZ, first_time, write_text

# Official locations that aren't a room in the GRB.
MARRIOTT = "(Marriott)"
OUTDOOR = {"Discovery Green", "The Grove"}
UNPLACED = {"Private", "Partner Events", "Naming Rights Events", "Blavity House Party Events"}
VENUE_KINDS = {"grb", "marriott", "outdoor", "offsite", "unplaced"}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60]


def iso(day, clock_text):
    """'2026-11-04' + '7:00 PM' → '2026-11-04T19:00:00-06:00', or None."""
    t = first_time(clock_text)
    if not t:
        return None
    dt = datetime.strptime(f"{day} {t}", "%Y-%m-%d %I:%M %p").replace(tzinfo=TZ)
    return dt.isoformat()


def iso_range(day, start_text, end_text):
    start, end = iso(day, start_text), iso(day, end_text)
    if start and end and end <= start:
        # Ends after midnight, e.g. 10:00 PM–2:00 AM.
        nxt = (date.fromisoformat(day) + timedelta(days=1)).isoformat()
        end = iso(nxt, end_text)
    return start, end


def official_kind(location):
    if MARRIOTT in location:
        return "marriott"
    if location in OUTDOOR:
        return "outdoor"
    if location in UNPLACED:
        return "unplaced"
    return "grb"


def official_events(venues):
    sessions = json.loads((ROOT / "data/sessions.json").read_text(encoding="utf-8"))
    events = []
    for s in sessions:
        start, end = iso_range(s["date"], s["start"], s["end"])
        label = s["location"].strip()
        key = slug(label) or None
        if key:
            venues.setdefault(key, {}).update(label=label, kind=official_kind(label))
        events.append({
            "id": s["id"],
            "kind": "official",
            "title": s["title"].strip(),
            "start": start,
            "end": end,
            "timeLabel": None if start else "TBA",
            "locationKey": key,
            "locationLabel": label,
            "address": None,
            "track": s["track"] or None,
            "categories": [],
            "speakers": [
                {"name": sp["name"], "title": sp["title"] or None, "company": sp["company"] or None}
                for sp in s.get("speaker_list", [])
                if sp.get("name")
            ],
            "host": None,
            "price": None,
            "access": None,
            "ticketLevels": [t for t in s["ticket_levels"].split("; ") if t],
            "rsvpUrl": None,
            "founderInvestorPick": False,
            "description": s["description"] or None,
            "sources": ["afrotech-official"],
        })
    return events


def side_events(venues):
    with open(ROOT / "data/side-events.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    events = []
    for r in rows:
        title = r["event"].strip()
        start, end = iso_range(r["date"], r["start"], r["end"])
        label = r["venue"].strip() or r["address"].strip()
        key = slug(label) or None
        if key:
            at_grb = "george r. brown" in f"{r['venue']} {r['address']}".lower()
            entry = venues.setdefault(key, {})
            # Official places (Discovery Green, the GRB) keep their own label and kind.
            entry.setdefault("label", label)
            entry.setdefault("kind", "grb" if at_grb else "offsite")
            if r["address"].strip():
                entry["address"] = r["address"].strip()
        digest = hashlib.sha1(f"{r['date']}|{slug(title)}".encode()).hexdigest()[:12]
        events.append({
            "id": f"side-{digest}",
            "kind": "side",
            "title": title,
            "start": start,
            "end": end,
            "timeLabel": None if start else "TBA",
            "locationKey": key,
            "locationLabel": label or "TBA",
            "address": r["address"].strip() or None,
            "track": None,
            "categories": [c.strip() for c in r["categories"].split(",") if c.strip()],
            "speakers": [],
            "host": r["host"].strip() or None,
            "price": r["price"].strip() or None,
            "access": r["registration"].strip() or None,
            "ticketLevels": [],
            "rsvpUrl": r["rsvp"].strip() or None,
            "founderInvestorPick": r["founder_investor_pick"] == "yes",
            "description": r["description"].strip() or None,
            "sources": [s.strip() for s in r["source"].split(",") if s.strip()],
        })
    return events


def validate(events, venues):
    """Mirror of the Event type in src/lib/types.ts; stop on the first mismatch."""
    ids = set()
    for e in events:
        where = f"{e.get('id')} ({e.get('title', '')[:40]})"
        assert e["id"] not in ids, f"duplicate id {where}"
        ids.add(e["id"])
        assert e["kind"] in ("official", "side"), where
        assert e["title"], where
        for k in ("start", "end"):
            if e[k] is not None:
                assert datetime.fromisoformat(e[k]).utcoffset() is not None, f"{k} lacks offset: {where}"
        assert e["start"] or e["timeLabel"], f"no start or timeLabel: {where}"
        if e["start"] and e["end"]:
            assert e["end"] > e["start"], f"ends before it starts: {where}"
        assert e["locationKey"] is None or e["locationKey"] in venues, f"unknown venue: {where}"
        assert isinstance(e["founderInvestorPick"], bool), where
        for k in ("categories", "speakers", "ticketLevels", "sources"):
            assert isinstance(e[k], list), f"{k}: {where}"
    for key, v in venues.items():
        assert v.get("label") and v.get("kind") in VENUE_KINDS, f"bad venue {key}"


def sort_key(e):
    return (e["start"] or "9999", e["title"].lower())


def main():
    venues_path = ROOT / "data/venues.json"
    venues = json.loads(venues_path.read_text(encoding="utf-8")) if venues_path.exists() else {}

    official = sorted(official_events(venues), key=sort_key)
    side = sorted(side_events(venues), key=sort_key)
    try:
        validate(official + side, venues)
    except AssertionError as err:
        sys.exit(f"Event data failed validation: {err}")

    def dump(obj):
        return json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=isinstance(obj, dict)) + "\n"

    write_text("data/events/official.json", dump(official))
    write_text("data/events/side.json", dump(side))
    write_text("data/venues.json", dump(venues))
    print(f"Wrote {len(official)} official and {len(side)} side events, {len(venues)} venues.")


if __name__ == "__main__":
    main()
