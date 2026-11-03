#!/usr/bin/env python3
"""Turn the merged schedules into the site's event format.

Reads data/sessions.json (official) and data/side-events.csv (side events) and
writes data/events/official.json, data/events/side.json and data/venues.json.
The shape matches the `ScheduleEvent` type in src/lib/types.ts.

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
    return re.sub(r"[^a-z0-9]+", "-", text.lower())[:60].strip("-")


def iso(day, clock_text):
    """'2026-11-04' + '7:00 PM' → '2026-11-04T19:00:00-06:00', or None."""
    t = first_time(clock_text)
    if not t:
        return None
    dt = datetime.strptime(f"{day} {t}", "%Y-%m-%d %I:%M %p").replace(tzinfo=TZ)
    return dt.isoformat()


def iso_range(day, start_text, end_text):
    start, end = iso(day, start_text), iso(day, end_text)
    if start and end == start:
        end = None  # a placeholder end, not a 24-hour event
    elif start and end and end < start:
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


def official_events(sessions, venues):
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
            "date": s["date"],
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


def side_venue_key(label, address, venues):
    """Key a side-event venue by name, splitting places that share a name.

    Two venues called "The Lounge" at different street addresses get separate
    keys, so each keeps its own address for the city map.
    """
    key = slug(label)
    known, here = street(venues.get(key, {}).get("address", "")), street(address)
    if known and here and known != here:
        key = slug(f"{label} {here}")
    return key


def street(address):
    """House number and street name, e.g. "2119-leeland", so "2119 Leeland St"
    and "2119 Leeland Street 77003" count as one place. None without a number."""
    m = re.search(r"\b(\d+)\s+([a-z]+)", address.lower())
    return f"{m[1]}-{m[2]}" if m else None


def side_events(rows, venues):
    events = []
    seen_ids = set()
    for r in rows:
        title = r["event"].strip()
        start, end = iso_range(r["date"], r["start"], r["end"])
        address = r["address"].strip()
        label = r["venue"].strip() or address
        key = side_venue_key(label, address, venues) if label else None
        if key:
            at_grb = "george r. brown" in f"{r['venue']} {address}".lower()
            entry = venues.setdefault(key, {})
            # Official places (Discovery Green, the GRB) keep their own label and kind,
            # and the first address seen for a venue sticks.
            entry.setdefault("label", label)
            entry.setdefault("kind", "grb" if at_grb else "offsite")
            if address:
                entry.setdefault("address", address)
        # Date + title keeps ids stable across refreshes; the start time only
        # separates two same-titled events on one day.
        event_id = "side-" + hashlib.sha1(f"{r['date']}|{slug(title)}".encode()).hexdigest()[:12]
        if event_id in seen_ids:
            event_id = "side-" + hashlib.sha1(f"{r['date']}|{slug(title)}|{r['start']}".encode()).hexdigest()[:12]
        seen_ids.add(event_id)
        events.append({
            "id": event_id,
            "kind": "side",
            "title": title,
            "date": r["date"],
            "start": start,
            "end": end,
            "timeLabel": None if start else "TBA",
            "locationKey": key,
            "locationLabel": label or "TBA",
            "address": address or None,
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
    """Mirror of ScheduleEvent in src/lib/types.ts; stop on the first mismatch."""
    ids = set()
    for e in events:
        where = f"{e.get('id')} ({e.get('title', '')[:40]})"
        assert e["id"] not in ids, f"duplicate id {where}"
        ids.add(e["id"])
        assert e["kind"] in ("official", "side"), where
        assert e["title"], where
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", e["date"] or ""), f"bad date: {where}"
        if e["start"]:
            assert e["start"].startswith(e["date"]), f"start not on date: {where}"
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


def build(sessions=None, side_rows=None):
    """Build and validate events. Raises ValueError, before anything is written.

    The update scripts pass their fresh rows in, so a validation failure leaves
    every generated file untouched. Without arguments, reads the saved files.
    """
    if sessions is None:
        sessions = json.loads((ROOT / "data/sessions.json").read_text(encoding="utf-8"))
    if side_rows is None:
        with open(ROOT / "data/side-events.csv", newline="", encoding="utf-8") as f:
            side_rows = list(csv.DictReader(f))
    venues_path = ROOT / "data/venues.json"
    venues = json.loads(venues_path.read_text(encoding="utf-8")) if venues_path.exists() else {}

    official = sorted(official_events(sessions, venues), key=sort_key)
    side = sorted(side_events(side_rows, venues), key=sort_key)
    try:
        validate(official + side, venues)
    except AssertionError as err:
        raise ValueError(f"Event data failed validation: {err}") from err
    return official, side, venues


def write(official, side, venues):
    def dump(obj):
        return json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=isinstance(obj, dict)) + "\n"

    write_text("data/events/official.json", dump(official))
    write_text("data/events/side.json", dump(side))
    write_text("data/venues.json", dump(venues))
    print(f"Wrote {len(official)} official and {len(side)} side events, {len(venues)} venues.")


def main():
    try:
        write(*build())
    except ValueError as err:
        sys.exit(str(err))


if __name__ == "__main__":
    main()
