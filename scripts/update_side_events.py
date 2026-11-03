#!/usr/bin/env python3
"""Merge community side-event lists into schedule/side-events.md + data/side-events.csv.

Sources:
  - afrotech.guide public events API (has RSVP links, venues, addresses)
  - Keith Azodeh's AfroTech 2026 Google Sheet (adds events not yet on the guide)
  - Adaptive Foundation's side-events guide (OneDrive xlsx, saved as
    data/sources/adaptive-foundation-side-events.csv because OneDrive blocks
    automated downloads; re-export it by hand to refresh)
"""
import csv
import difflib
import io
import json
import re
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

GUIDE_API = "https://afrotech.guide/api/events"
SHEET_ID = "1PLDLOdFCuwDAy4fe5y09hb4KgYlX3bsgX60U2z2KE_0"
SHEET_CSV = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv"
SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit"
TZ = ZoneInfo("America/Chicago")
YEAR = 2026
ROOT = Path(__file__).resolve().parent.parent
ADAPTIVE_CSV = ROOT / "data/sources/adaptive-foundation-side-events.csv"
ADAPTIVE_URL = "https://1drv.ms/x/c/201780541da98428/IQAwneocjcw7RLgXigZPaCX-Afj6iRzSioL8HrnOZ6uMc-Y"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "afrotech-notes/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def key(title):
    return re.sub(r"[^a-z0-9]", "", title.lower())


def clock(dt):
    return dt.strftime("%-I:%M %p")


def cell(text):
    return re.sub(r"\s+", " ", (text or "").replace("|", "\\|")).strip()


def from_guide():
    events = []
    for e in json.loads(fetch(GUIDE_API))["items"]:
        start = datetime.fromisoformat(e["startAt"].replace("Z", "+00:00")).astimezone(TZ)
        end = datetime.fromisoformat(e["endAt"].replace("Z", "+00:00")).astimezone(TZ) if e.get("endAt") else None
        events.append({
            "date": start.date().isoformat(),
            "start": e.get("timeLabel") or clock(start),
            "end": clock(end) if end and end != start else "",
            "event": e["title"].strip(),
            "host": e.get("host") or "",
            "venue": e.get("venueName") or "",
            "address": e.get("address") or "",
            "price": e.get("priceType") or "",
            "type": e.get("kind") or "",
            "categories": ", ".join(e.get("categories") or []),
            "rsvp": e.get("ticketUrl") or e.get("sourceUrl") or "",
            "registration": "",
            "founder_investor_pick": "",
            "description": e.get("description") or "",
            "source": "afrotech.guide",
        })
    return events


def from_sheet():
    rows = list(csv.reader(io.StringIO(fetch(SHEET_CSV))))
    # The first header cell is merged with the sheet's banner text.
    header = ["DATE"] + [h.strip() for h in rows[0][1:]]
    events = []
    for r in rows[1:]:
        row = dict(zip(header, (c.strip() for c in r)))
        m = re.search(r"(\d{1,2})/(\d{1,2})", row.get("DATE", ""))
        if not m or not row.get("EVENT"):
            continue
        price = row.get("PRICE", "")
        if re.fullmatch(r"[\d.]+", price):
            price = f"${float(price):,.2f}"
        events.append({
            "date": f"{YEAR}-{int(m[1]):02d}-{int(m[2]):02d}",
            "start": row.get("START", ""),
            "end": row.get("END", ""),
            "event": row["EVENT"],
            "host": row.get("HOST", ""),
            "venue": "" if row.get("VENUE") == "TBD" else row.get("VENUE", ""),
            "address": row.get("ADDRESS", ""),
            "price": price,
            "type": row.get("TYPE", ""),
            "categories": row.get("CATEGORIES", ""),
            "rsvp": "",
            "registration": "",
            "founder_investor_pick": "",
            "description": row.get("DESCRIPTION", ""),
            "source": "google-sheet",
        })
    return events


def from_adaptive():
    if not ADAPTIVE_CSV.exists():
        return []
    events = []
    with open(ADAPTIVE_CSV, newline="") as f:
        for r in csv.DictReader(f):
            events.append({
                "date": r["date"], "start": r["start"], "end": r["end"], "event": r["event"],
                "host": r["host"], "venue": r["venue"], "address": r["address"],
                "price": r["cost"], "type": r["type"], "categories": "",
                "rsvp": r["link"], "registration": r["registration"],
                "founder_investor_pick": r["founder_investor_pick"],
                "description": "", "source": "adaptive-foundation",
            })
    return events


def same_event(a, b):
    """Titles differ a little between lists ("Pickleball Clinic" vs "AfroTech Pickleball Clinic")."""
    if a["date"] != b["date"]:
        return False
    ka, kb = key(a["event"]), key(b["event"])
    if ka == kb or (min(len(ka), len(kb)) >= 12 and (ka in kb or kb in ka)):
        return True
    ratio = difflib.SequenceMatcher(None, ka, kb).ratio()
    same_start = first_time(a["start"]) and first_time(a["start"]) == first_time(b["start"])
    return ratio >= 0.85 or (same_start and ratio >= 0.6)


def first_time(text):
    m = re.search(r"\d{1,2}:\d{2}\s*[AP]M", text or "", re.I)
    return m.group(0).upper().replace(" ", "") if m else ""


def merge(events):
    merged = []
    for e in events:
        match = next((m for m in merged if same_event(m, e)), None)
        if match is None:
            merged.append(dict(e))
            continue
        # Earlier sources win; later ones only fill gaps.
        for k, v in e.items():
            if v and not match.get(k):
                match[k] = v
        if e["source"] not in match["source"]:
            match["source"] += f", {e['source']}"
    return merged


def sort_key(e):
    try:
        t = datetime.strptime(first_time(e["start"]), "%I:%M%p").time().isoformat()
    except ValueError:
        t = "99"  # unknown times last
    return (e["date"], t, e["event"].lower())


def main():
    events = sorted(merge(from_guide() + from_sheet() + from_adaptive()), key=sort_key)

    with open(ROOT / "data/side-events.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(events[0]))
        w.writeheader()
        w.writerows(events)

    by_day = defaultdict(list)
    for e in events:
        by_day[e["date"]].append(e)

    out = [
        "# Side events",
        "",
        f"{len(events)} community events around AfroTech 2026 (parties, mixers, dinners, workshops).",
        "Times are Houston time (CST). Always confirm on the RSVP page — details change.",
        "",
        "Sources, merged and de-duplicated:",
        f"- [afrotech.guide]({GUIDE_API.rsplit('/api', 1)[0]}) events list",
        f"- [AfroTech 2026 community sheet]({SHEET_URL})",
        f"- [Adaptive Foundation side-events guide]({ADAPTIVE_URL}) (Lyncy Nyandoche)",
        "",
        "⭐ = Founder & Investor pick (Adaptive Foundation's shortlist). _No link_ = check the",
        "community sheet or afrotech.guide.",
        "",
        "Generated by `scripts/update_side_events.py`; re-run it to refresh.",
        "",
    ]
    for d in sorted(by_day):
        label = datetime.fromisoformat(d).strftime("%a, %b %-d")
        out.append(f"- [{label}](#{d}) — {len(by_day[d])} events")
    for d in sorted(by_day):
        label = datetime.fromisoformat(d).strftime("%A, %B %-d")
        out += ["", f'<a id="{d}"></a>', "", f"## {label}", "",
                "| Time | Event | Host | Venue | Price | Access | RSVP |",
                "|------|-------|------|-------|-------|--------|------|"]
        for e in by_day[d]:
            time = "–".join(x for x in (e["start"], e["end"]) if x) or "TBD"
            rsvp = f"[RSVP]({e['rsvp']})" if e["rsvp"] else "_No link_"
            star = "⭐ " if e["founder_investor_pick"] else ""
            out.append(f"| {time} | {star}**{cell(e['event'])}** | {cell(e['host'])} | "
                       f"{cell(e['venue'])} | {cell(e['price'])} | {cell(e['registration'])} | {rsvp} |")
    (ROOT / "schedule/side-events.md").write_text("\n".join(out) + "\n")
    print(f"Wrote {len(events)} side events across {len(by_day)} days.")


if __name__ == "__main__":
    main()
