#!/usr/bin/env python3
"""Merge community side-event lists into schedule/side-events.md + data/side-events.csv.

Sources, in priority order (earlier sources win when the same event appears twice):
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
import sys
from collections import defaultdict
from datetime import date, datetime

import build_events
import enrich_events
from common import ROOT, TZ, cell, clock, fetch, first_time, guard_shrink, link, short_date, write_csv, write_text

GUIDE_API = "https://afrotech.guide/api/events"
SHEET_ID = "1PLDLOdFCuwDAy4fe5y09hb4KgYlX3bsgX60U2z2KE_0"
SHEET_CSV = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv"
SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit"
ADAPTIVE_CSV = ROOT / "data/sources/adaptive-foundation-side-events.csv"
ADAPTIVE_URL = "https://1drv.ms/x/c/201780541da98428/IQAwneocjcw7RLgXigZPaCX-Afj6iRzSioL8HrnOZ6uMc-Y"
YEAR = 2026
FIELDS = ["date", "start", "end", "event", "host", "venue", "address", "price", "type",
          "categories", "rsvp", "registration", "founder_investor_pick", "description", "source"]


def event(**kw):
    return {f: kw.get(f, "") for f in FIELDS}


def key(title):
    return re.sub(r"[^a-z0-9]", "", title.lower())


def from_guide():
    events = []
    for e in json.loads(fetch(GUIDE_API))["items"]:
        start = datetime.fromisoformat(e["startAt"].replace("Z", "+00:00")).astimezone(TZ)
        end = datetime.fromisoformat(e["endAt"].replace("Z", "+00:00")).astimezone(TZ) if e.get("endAt") else None
        events.append(event(
            date=start.date().isoformat(),
            start=clock(start),
            end=clock(end) if end and end != start else "",
            event=e["title"].strip(),
            host=e.get("host") or "",
            venue=e.get("venueName") or "",
            address=e.get("address") or "",
            price=e.get("priceType") or "",
            type=e.get("kind") or "",
            categories=", ".join(e.get("categories") or []),
            rsvp=e.get("ticketUrl") or e.get("sourceUrl") or "",
            description=e.get("description") or "",
            source="afrotech.guide",
        ))
    return events


def from_sheet():
    rows = list(csv.reader(io.StringIO(fetch(SHEET_CSV))))
    if not rows:
        return []
    # The first header cell is merged with the sheet's banner text.
    header = ["DATE"] + [h.strip() for h in rows[0][1:]]
    events = []
    for r in rows[1:]:
        row = dict(zip(header, (c.strip() for c in r)))
        m = re.search(r"(\d{1,2})/(\d{1,2})", row.get("DATE", ""))
        if not m or not row.get("EVENT"):
            continue
        price = row.get("PRICE", "")
        if re.fullmatch(r"\d+(\.\d+)?", price):
            price = f"${float(price):,.2f}"
        events.append(event(
            date=f"{YEAR}-{int(m[1]):02d}-{int(m[2]):02d}",
            start=first_time(row.get("START", "")),
            end=first_time(row.get("END", "")),
            event=row["EVENT"],
            host=row.get("HOST", ""),
            venue="" if row.get("VENUE") == "TBD" else row.get("VENUE", ""),
            address=row.get("ADDRESS", ""),
            price=price,
            type=row.get("TYPE", ""),
            categories=row.get("CATEGORIES", ""),
            description=row.get("DESCRIPTION", ""),
            source="google-sheet",
        ))
    return events


def from_adaptive():
    if not ADAPTIVE_CSV.exists():
        return []
    events = []
    # utf-8-sig: Excel's "CSV UTF-8" export starts with a byte-order mark.
    with open(ADAPTIVE_CSV, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            events.append(event(
                date=r["date"], start=first_time(r["start"]), end=first_time(r["end"]),
                event=r["event"], host=r["host"], venue=r["venue"], address=r["address"],
                price=r["cost"], type=r["type"], rsvp=r["link"], registration=r["registration"],
                founder_investor_pick="yes" if r["founder_investor_pick"].strip().lower() == "yes" else "",
                source="adaptive-foundation",
            ))
    return events


def match_score(a, b):
    """How likely two listings on the same day are one event (0 = different).

    Titles differ a little between lists ("Pickleball Clinic" vs "AfroTech
    Pickleball Clinic"), so exact matches score highest, then containment, then
    fuzzy matches. A loose fuzzy match also needs the same start time.
    """
    if a["date"] != b["date"]:
        return 0
    ka, kb = key(a["event"]), key(b["event"])
    if ka == kb:
        return 2
    if min(len(ka), len(kb)) >= 12 and (ka in kb or kb in ka):
        return 1.5
    ratio = difflib.SequenceMatcher(None, ka, kb).ratio()
    same_start = a["start"] and a["start"] == b["start"]
    return ratio if ratio >= 0.85 or (same_start and ratio >= 0.6) else 0


def dedupe(rows):
    """Collapse exact repeats inside one list: same date, title and start time.

    A source sometimes lists one event twice; the copies fill each other's gaps.
    """
    kept = {}
    for r in rows:
        k = (r["date"], key(r["event"]), r["start"])
        if k in kept:
            for f, v in r.items():
                if v and not kept[k].get(f):
                    kept[k][f] = v
        else:
            kept[k] = dict(r)
    return list(kept.values())


def merge(sources):
    """Merge lists in priority order.

    Each incoming list is matched against what's merged so far, best matches
    first, and each merged event absorbs at most one row from a list. Rows from
    the same list never merge with each other.
    """
    merged = []
    for rows in sources:
        pairs = sorted(
            ((match_score(m, r), mi, ri) for mi, m in enumerate(merged) for ri, r in enumerate(rows)),
            reverse=True,
        )
        used_m, used_r = set(), set()
        for score, mi, ri in pairs:
            if score == 0:
                break
            if mi in used_m or ri in used_r:
                continue
            used_m.add(mi)
            used_r.add(ri)
            m, r = merged[mi], rows[ri]
            for k, v in r.items():  # earlier sources win; later ones fill gaps
                if v and not m.get(k):
                    m[k] = v
            m["source"] += f", {r['source']}"
        merged += [dict(r) for ri, r in enumerate(rows) if ri not in used_r]
    return merged


def sort_key(e):
    t = first_time(e["start"])
    when = datetime.strptime(t, "%I:%M %p").time().isoformat() if t else "99"  # unknown times last
    return (e["date"], when, e["event"].lower())


def main():
    guide, sheet, adaptive = from_guide(), from_sheet(), from_adaptive()
    # The two live sources should never come back empty; if one does, it's
    # broken (an error page, a login wall), not a quiet week.
    for name, rows in (("afrotech.guide", guide), ("the community sheet", sheet)):
        if not rows:
            sys.exit(f"No events from {name}; keeping the existing files.")
    sources = [dedupe(rows) for rows in (guide, sheet, adaptive)]
    events = sorted(merge(sources), key=sort_key)
    if not events:
        sys.exit("No side events found in any source; keeping the existing files.")
    saved = ROOT / "data/side-events.csv"
    if saved.exists():
        with open(saved, newline="", encoding="utf-8") as f:
            old_count = sum(1 for _ in csv.DictReader(f))
        guard_shrink("Side events", len(events), old_count)

    # Validate the site's event data first, so a failure writes nothing.
    try:
        built = build_events.build(side_rows=events)
    except ValueError as err:
        sys.exit(f"{err}; keeping the existing files.")

    write_csv("data/side-events.csv", events, FIELDS)

    by_day = defaultdict(list)
    for e in events:
        by_day[e["date"]].append(e)

    out = [
        "# Side events",
        "",
        f"{len(events)} community events around AfroTech 2026 (parties, mixers, dinners, workshops).",
        "Times are Houston time (CST). Always confirm on the RSVP page, since details change.",
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
        out.append(f"- [{short_date(date.fromisoformat(d))}](#{d}) — {len(by_day[d])} events")
    for d in sorted(by_day):
        out += ["", f'<a id="{d}"></a>', "", f"## {short_date(date.fromisoformat(d))}", "",
                "| Time | Event | Host | Venue | Price | Access | RSVP |",
                "|------|-------|------|-------|-------|--------|------|"]
        for e in by_day[d]:
            time = "–".join(x for x in (e["start"], e["end"]) if x) or "TBA"
            rsvp = link("RSVP", e["rsvp"]) or "_No link_"
            star = "⭐ " if e["founder_investor_pick"] == "yes" else ""
            out.append(f"| {cell(time)} | {star}**{cell(e['event'])}** | {cell(e['host'])} | "
                       f"{cell(e['venue'])} | {cell(e['price'])} | {cell(e['registration'])} | {rsvp} |")
    write_text("schedule/side-events.md", "\n".join(out) + "\n")
    print(f"Wrote {len(events)} side events across {len(by_day)} days.")
    build_events.write(*built)

    # Then read each event's own page (at most once a day per page), from the
    # list just written, and rebuild with it. Everything above is already
    # saved, so a problem here costs only this run's page data.
    try:
        enrich_events.main([])
        pages = build_events.load_event_pages()
        rebuilt = build_events.build(side_rows=events, pages=pages)
    except Exception as err:  # noqa: BLE001 - never undo the side-event refresh
        print(f"Event pages not used this run: {err!r}", file=sys.stderr)
        return
    build_events.write(*rebuilt)
    write_text("schedule/side-events.md", "\n".join(out + page_differences(events, pages)) + "\n")


def page_differences(events, pages):
    """What each event's own page changed, for a person to check (plan 0008)."""
    _, changes = build_events.apply_event_pages(events, pages)
    if not changes:
        return []
    names = {"status": "Status", "name": "Name", "date": "Date", "start": "Start", "end": "End",
             "location": "Location"}
    out = ["", "## Changes from event pages", "",
           "Each side event was checked against its own page, and the site uses the page's",
           "name, date, times and location. A page with no location removes ours. These rows",
           "differ from the lists; the site shows the page's version (a status is shown here only).", "",
           "| Date | Event | What | List says | Page says |",
           "|------|-------|------|-----------|-----------|"]
    for d in sorted(changes, key=lambda d: (d["date"], d["title"], d["field"])):
        out.append(f"| {d['date']} | {link(cell(d['title']), d['url'])} | {names.get(d['field'], d['field'])} | "
                   f"{cell(d['list'])} | {cell(d['page'])} |")
    return out


if __name__ == "__main__":
    main()
