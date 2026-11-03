#!/usr/bin/env python3
"""Turn the merged schedules into the site's event format.

Reads data/sessions.json (official) and data/side-events.csv (side events) and
writes data/events/official.json, data/events/side.json, data/venues.json and
data/speakers.json (minus anyone listed in data/sources/speaker-suppressions.json).
The shape matches the `ScheduleEvent` type in src/lib/types.ts.

data/venues.json is partly hand-maintained: this script only adds places it
hasn't seen and refreshes their label, kind and address. Fields added later
by hand or by other scripts (areaId, level, approximate, note, lat, lng) are
kept. A venue with an areaId takes its level from the map, so it never sets
`level` itself; `approximate` on a venue means its spot within its area or
level is unknown, while the map marks areas whose shape is a guess.
"""
import csv
import hashlib
import html
import json
import re
import sys
from urllib.parse import urlparse
from datetime import date, datetime, timedelta

from common import ROOT, TZ, clock, first_time, write_text

# Official locations that aren't a room in the GRB.
MARRIOTT = "(Marriott)"
OUTDOOR = {"Discovery Green", "The Grove"}
UNPLACED = {"Private", "Partner Events", "Naming Rights Events", "Blavity House Party Events"}
VENUE_KINDS = {"grb", "marriott", "outdoor", "offsite", "unplaced"}
# Places at the conference site, which belong on the floor plan.
ON_SITE_KINDS = {"grb", "marriott", "outdoor"}


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


# ---- Speakers -------------------------------------------------------------

SUPPRESSIONS = ROOT / "data/sources/speaker-suppressions.json"
RESEARCH = ROOT / "data/sources/speaker-research.json"
LINK_LABELS = {"linkedin": "LinkedIn", "twitter": "X", "facebook": "Facebook", "instagram": "Instagram"}
HANDLE_HOSTS = {"twitter": "x.com", "instagram": "instagram.com", "facebook": "facebook.com", "linkedin": "linkedin.com/in"}
BRIEF_MAX = 200


def plain_bio(raw):
    """Sessionboard bios are HTML; keep paragraphs, drop tags and entities."""
    text = re.sub(r"(?i)<br\s*/?>|</(p|li|div|h\d)>", "\n", raw or "")
    text = html.unescape(re.sub(r"<[^>]+>", "", text)).replace("\u00a0", " ")
    paragraphs = [re.sub(r"[ \t]+", " ", p).strip() for p in text.split("\n")]
    return "\n\n".join(p for p in paragraphs if p)


# A full stop after these isn't the end of a sentence ("Dr. Jane", "Charles R. Drew").
NOT_SENTENCE_END = re.compile(r"(?:\b[A-Z]|\b(?:Dr|Mr|Mrs|Ms|Mx|Prof|Jr|Sr|St|Rev|Hon|Inc|Co|Corp|Ltd|vs|No))\.$")


def sentences_of(text):
    parts, current = [], ""
    for piece in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9“\"])", text):
        current = f"{current} {piece}".strip()
        if not NOT_SENTENCE_END.search(current):
            parts.append(current)
            current = ""
    if current:
        parts.append(current)
    return parts


def brief(bio):
    """The bio's first sentence or two, up to about 200 characters."""
    first = bio.split("\n\n")[0] if bio else ""
    sentences = sentences_of(first)
    out = ""
    for s in sentences:
        if out and len(out) + 1 + len(s) > BRIEF_MAX:
            break
        out = f"{out} {s}".strip()
    if len(out) > BRIEF_MAX:
        out = out[: BRIEF_MAX - 1].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return out or None


def safe_url(value, kind):
    """A usable https link from a URL or a bare handle; None for anything else."""
    value = (value or "").strip()
    if not value:
        return None
    if not re.match(r"(?i)^https?://", value):
        if "." in value.split("/")[0]:
            value = f"https://{value}"
        else:
            value = f"https://{HANDLE_HOSTS[kind]}/{value.lstrip('@')}"
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or " " in value:
        return None
    return value.replace("http://", "https://", 1)


# Social sites by host; anything else is labelled as a website.
SITE_LABELS = {
    "linkedin.com": ("linkedin", "LinkedIn"),
    "x.com": ("x", "X"),
    "twitter.com": ("x", "X"),
    "facebook.com": ("facebook", "Facebook"),
    "instagram.com": ("instagram", "Instagram"),
    "tiktok.com": ("tiktok", "TikTok"),
    "youtube.com": ("youtube", "YouTube"),
    "github.com": ("github", "GitHub"),
}


def classify_link(url):
    """Label a link by where it actually points, since source fields get mixed up.
    Drops bare home pages such as https://linkedin.com that name no one."""
    if not url:
        return None
    url = url.split("#google_vignette")[0]  # an ad-script fragment, not part of the page
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    kind, label = SITE_LABELS.get(host, ("website", "Website"))
    if kind != "website" and parsed.path.strip("/") == "":
        return None
    return {"kind": kind, "label": label, "url": url}


def load_suppressions():
    if not SUPPRESSIONS.exists():
        return set()
    data = json.loads(SUPPRESSIONS.read_text(encoding="utf-8"))
    return {entry["id"] for entry in data.get("removed", [])}


def approved_research(speaker_id, research):
    """The approved, researched extras for one speaker, or None.

    Only rows marked "approved" are published; drafts and rejected rows stay
    in data/sources/speaker-research.json for review.
    """
    entry = research.get(speaker_id)
    if not entry:
        return None

    def ok(row):
        return row.get("status") == "approved" and str(row.get("url", "")).startswith("https://")

    facts = [
        {k: row.get(k) for k in ("text", "url", "publisher", "date")}
        for row in entry.get("facts", []) if ok(row)
    ][:3]
    articles = [
        {k: row.get(k) for k in ("title", "url", "publisher", "date", "kind")}
        for row in entry.get("articles", []) if ok(row)
    ][:3]
    website = entry.get("website")
    website = website["url"] if website and ok(website) else None
    if not (facts or articles or website):
        return None
    return {"facts": facts, "articles": articles, "website": website, "checkedAt": entry.get("researchedAt")}


def load_research():
    if not RESEARCH.exists():
        return {}
    return json.loads(RESEARCH.read_text(encoding="utf-8")).get("speakers", {})


def build_speakers(sessions):
    """One profile per speaker id, from the speaker records on each session."""
    suppressed = load_suppressions()
    research = load_research()
    records, session_ids = {}, {}
    for s in sessions:
        for sp in s.get("speaker_list", []):
            if not sp.get("id") or not sp.get("name"):
                continue
            records.setdefault(sp["id"], sp)
            session_ids.setdefault(sp["id"], []).append(s["id"])

    speakers, taken = [], set()
    for sid, sp in sorted(records.items(), key=lambda kv: (kv[1]["name"].lower(), kv[0])):
        if sid in suppressed:
            continue
        base = slug(sp["name"]) or "speaker"
        s_slug, n = base, 2
        while s_slug in taken:
            s_slug, n = f"{base}-{n}", n + 1
        taken.add(s_slug)
        bio = plain_bio(sp.get("about"))
        photo = safe_url(sp.get("image"), "linkedin")
        links = []
        for field in LINK_LABELS:
            link = classify_link(safe_url(sp.get(field), field))
            if link and link["url"] not in {l["url"] for l in links}:
                links.append(link)
        speakers.append({
            "id": sid,
            "slug": s_slug,
            "name": sp["name"].strip(),
            "title": sp.get("title") or None,
            "company": sp.get("company") or None,
            "brief": brief(bio),
            "bio": bio or None,
            "photoUrl": photo if photo and photo.startswith("https://") else None,
            "links": links,
            "sessionIds": session_ids[sid],
            "research": approved_research(sid, research),
        })
    return speakers


def validate_speakers(speakers, events):
    event_ids = {e["id"] for e in events}
    slugs = set()
    for sp in speakers:
        assert sp["slug"] not in slugs, f"duplicate speaker slug {sp['slug']}"
        slugs.add(sp["slug"])
        assert sp["name"], sp["id"]
        assert all(i in event_ids for i in sp["sessionIds"]), f"unknown session for {sp['name']}"
        for link in sp["links"]:
            assert link["url"].startswith("https://"), f"unsafe link for {sp['name']}"
        if sp["research"]:
            r = sp["research"]
            for row in r["facts"] + r["articles"]:
                assert row["url"].startswith("https://"), f"unsafe research link for {sp['name']}"
            assert all(f.get("text") for f in r["facts"]), f"empty fact for {sp['name']}"


# ---- Events ---------------------------------------------------------------


def official_events(sessions, venues, speaker_slugs=None):
    speaker_slugs = speaker_slugs or {}
    events = []
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
                {
                    "name": sp["name"],
                    "title": sp["title"] or None,
                    "company": sp["company"] or None,
                    "slug": speaker_slugs.get(sp.get("id")),
                }
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


EVENT_PAGES = ROOT / "data/event-pages.json"


def load_event_pages():
    """data/event-pages.json's pages (scripts/enrich_events.py), or {}."""
    if not EVENT_PAGES.exists():
        return {}
    try:
        return json.loads(EVENT_PAGES.read_text(encoding="utf-8")).get("pages", {})
    except (ValueError, AttributeError) as err:
        # Optional data: a broken file must not stop the build.
        print(f"Ignoring {EVENT_PAGES.name}: {err}", file=sys.stderr)
        return {}


def same_text(a, b):
    """Equal apart from case, spacing and punctuation."""
    norm = lambda t: re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()
    return norm(a) == norm(b)


def apply_event_pages(rows, pages):
    """Check each side event against its own page, and let the page win.

    Plan 0008. Each event's own page (its "official link") is the authority on
    its name, date, start and end time, and location; when a page was read and
    says something different, the page's version is used. A page read without
    any location removes ours. Price and description only fill gaps.

    Nothing changes when a page wasn't read, has no Event block, or is shared
    by rows on several days (a series page can't speak for each day). Event
    ids keep coming from the list's own date and name (_id_date, _id_title),
    so a rename doesn't break saved plans or notes.

    Returns copies of the rows, which the caller must not write back to the
    CSV, and every change made, for a person to check.
    """
    out_rows, changes = [], []
    # Pages can move an event within the week the lists cover, not beyond it:
    # a page showing another month is a recurring event's next date.
    list_days = sorted(r["date"] for r in rows) or [""]
    first_day = (date.fromisoformat(list_days[0]) - timedelta(days=1)).isoformat() if list_days[0] else ""
    last_day = (date.fromisoformat(list_days[-1]) + timedelta(days=1)).isoformat() if list_days[-1] else ""
    days_per_url = {}
    for r in rows:
        days_per_url.setdefault((r.get("rsvp") or "").strip(), set()).add(r["date"])
    for r in rows:
        url = (r.get("rsvp") or "").strip()
        page = (pages.get(url) or {}).get("event")
        if not page or len(days_per_url.get(url, ())) > 1:
            out_rows.append(r)
            continue
        r2 = {**r, "_id_date": r["date"], "_id_title": r["event"], "_id_start": r["start"]}

        def change(field, ours, theirs):
            changes.append({"date": r["date"], "title": r["event"].strip(), "url": url,
                            "field": field, "list": ours or "(none)", "page": theirs or "(none)"})

        if page.get("status"):
            change("status", "on", page["status"])

        page_start = page.get("start")
        page_day = (page_start or page.get("startDay") or "")[:10]
        if page_day and not (first_day <= page_day <= last_day):
            # Another occurrence, not this one: change nothing, but list it.
            change("date", r["date"], f"{page_day} (outside the week; not applied)")
            out_rows.append(r)
            continue

        # Name, without a ticket site's branding ("… | Eventbrite").
        title = re.sub(r"\s*[|–-]\s*(eventbrite|posh|luma|partiful)\s*$", "", page.get("title") or "", flags=re.I)
        if title and not same_text(title, r["event"]):
            r2["event"] = title
            change("name", r["event"].strip(), title)

        # Date and times.
        if page_day and page_day != r["date"]:
            r2["date"] = page_day
            change("date", r["date"], page_day)
        if page_start:
            start_clock = clock(datetime.fromisoformat(page_start))
            if iso(r2["date"], r["start"]) != page_start:
                r2["start"] = start_clock
                change("start", r["start"].strip(), start_clock)
            page_end = page.get("end")
            length = (datetime.fromisoformat(page_end) - datetime.fromisoformat(page_start)) if page_end else None
            if length is not None and timedelta(0) < length <= timedelta(hours=24):
                end_clock = clock(datetime.fromisoformat(page_end))
                if first_time(r["end"]) != end_clock:
                    r2["end"] = end_clock
                    change("end", r["end"].strip(), end_clock)
            elif r2["start"] != r["start"] and r["end"].strip():
                # A new start with no usable end: our old end may now come first.
                r2["end"] = ""
                change("end", r["end"].strip(), "")

        # Location: the page's, or none if the page gives none. A page that
        # gives less than we have (only a city, or a venue name without an
        # address, as many show until you RSVP) doesn't replace our address.
        venue, address = page.get("venue") or "", page.get("address") or ""
        if venue == "Online":
            venue, address = "Online", ""
        ours_venue, ours_address = r["venue"].strip(), r["address"].strip()
        ours = " · ".join(x for x in (ours_venue, ours_address) if x)
        theirs = " · ".join(x for x in (venue, address) if x)
        on_site = "george r. brown" in ours.lower() or "grb" in ours.lower().split()
        vague = venue != "Online" and not street(address or "") and bool(street(ours_address))
        if not venue and not address:
            if ours:
                r2["venue"], r2["address"] = "", ""
                change("location", ours, "none on the page (removed)")
        elif on_site or vague:
            pass  # keep ours: the convention center's map spot, or a fuller address
        elif address and street(address) and street(address) == street(ours_address):
            pass  # same place, written differently
        elif address and not ours_address and (not ours_venue or same_text(venue, ours_venue)):
            r2["address"] = address  # a gap, not a disagreement
            if venue and not ours_venue:
                r2["venue"] = venue
        elif not address and not ours_address and same_text(venue, ours_venue):
            pass
        else:
            r2["venue"], r2["address"] = venue, address
            change("location", ours, theirs)

        # Gaps only.
        for field in ("price", "description"):
            if not (r.get(field) or "").strip() and page.get(field):
                r2[field] = page[field]

        if any(r2.get(k) != r.get(k) for k in ("event", "date", "start", "end", "venue", "address", "price", "description")):
            r2["source"] = ", ".join(p for p in (r.get("source", "").strip(), "event page") if p)
        out_rows.append(r2)
    return out_rows, changes


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
            where = f"{r['venue']} {address}".lower()
            # "Downtown Houston, near the George R. Brown…" is not inside it.
            at_grb = "george r. brown" in where and "near the george r. brown" not in where
            entry = venues.setdefault(key, {})
            # Official places (Discovery Green, the GRB) keep their own label and kind,
            # and the first address seen for a venue sticks.
            entry.setdefault("label", label)
            entry.setdefault("kind", "grb" if at_grb else "offsite")
            if address:
                entry.setdefault("address", address)
        # Date + title keeps ids stable across refreshes; the start time only
        # separates two same-titled events on one day.
        # Ids come from the list's own date and name, even when the event's
        # page renamed or moved it (apply_event_pages), so saved plans and
        # notes keep pointing at the right event.
        id_date, id_title = r.get("_id_date", r["date"]), r.get("_id_title", title).strip()
        id_start = r.get("_id_start", r["start"])
        event_id = "side-" + hashlib.sha1(f"{id_date}|{slug(id_title)}".encode()).hexdigest()[:12]
        if event_id in seen_ids:
            event_id = "side-" + hashlib.sha1(f"{id_date}|{slug(id_title)}|{id_start}".encode()).hexdigest()[:12]
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
    plan_path = ROOT / "data/floor-plan.json"
    assert plan_path.exists(), "data/floor-plan.json is missing; run scripts/build_floor_plan.py"
    areas = json.loads(plan_path.read_text(encoding="utf-8"))["areas"]
    for key, v in venues.items():
        assert v.get("label") and v.get("kind") in VENUE_KINDS, f"bad venue {key}"
        if v.get("areaId"):
            area = areas.get(v["areaId"])
            assert area, f"venue {key} points at unknown map area {v['areaId']}"
            # The area is the one source for these; the venue doesn't repeat them.
            assert "level" not in v, f"venue {key} has an area, so its level comes from the map; drop 'level'"
            assert not (area["approximate"] and "approximate" in v), (
                f"venue {key}: area {v['areaId']} is already approximate; drop 'approximate'"
            )
    # New on-site places need a map spot or a note in data/venues.json; warn
    # rather than fail, so a new room in a source can't stop the refresh.
    unmapped = [k for k, v in venues.items() if v["kind"] in ON_SITE_KINDS and not v.get("areaId") and not v.get("note")]
    if unmapped:
        print(f"Note: {len(unmapped)} on-site venue(s) have no map area or note yet: {', '.join(unmapped)}")


def sort_key(e):
    return (e["start"] or "9999", e["title"].lower())


def build(sessions=None, side_rows=None, pages=None):
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

    speakers = build_speakers(sessions)
    slugs = {sp["id"]: sp["slug"] for sp in speakers}
    official = sorted(official_events(sessions, venues, slugs), key=sort_key)
    side_rows, _ = apply_event_pages(side_rows, load_event_pages() if pages is None else pages)
    side = sorted(side_events(side_rows, venues), key=sort_key)
    try:
        validate(official + side, venues)
        validate_speakers(speakers, official)
    except AssertionError as err:
        raise ValueError(f"Event data failed validation: {err}") from err
    return official, side, venues, speakers


def write(official, side, venues, speakers):
    def dump(obj):
        return json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=isinstance(obj, dict)) + "\n"

    write_text("data/events/official.json", dump(official))
    write_text("data/events/side.json", dump(side))
    write_text("data/venues.json", dump(venues))
    write_text("data/speakers.json", dump(speakers))
    print(f"Wrote {len(official)} official and {len(side)} side events, {len(venues)} venues, {len(speakers)} speakers.")


def main():
    try:
        write(*build())
    except ValueError as err:
        sys.exit(str(err))


if __name__ == "__main__":
    main()
