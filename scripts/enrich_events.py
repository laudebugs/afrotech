#!/usr/bin/env python3
"""Read each side event's own page and save what it says about the event.

    python3 scripts/enrich_events.py            # pages not read in the last day
    python3 scripts/enrich_events.py --force    # every page

Plan 0008, todo 033. Event pages on posh.vip, Eventbrite, Luma and similar
sites publish a schema.org Event block (JSON-LD) for search engines, with the
start and end time, the venue and address, the price, the organiser and a
description. This script fetches each side event's link from
data/side-events.csv, reads that block, and writes the result to
data/event-pages.json, keyed by URL. build_events.py (todo 034) uses it only
to fill fields the community lists leave empty.

Fetches go one at a time, a second apart, with no sign-in, and each page at
most once a day, whether it loaded or not. A page that fails keeps its last
good result. A run stops fetching after RUN_BUDGET and carries on next time.
"""
import csv
import html
import http.client
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from common import ROOT, TZ, fetch, write_text

OUT = "data/event-pages.json"
SIDE_CSV = ROOT / "data/side-events.csv"
FRESH_FOR = timedelta(days=1)
PAUSE_SECONDS = 1.0
FETCH_TIMEOUT = 20  # seconds per page
RUN_BUDGET = timedelta(minutes=15)  # the refresh Action runs every two hours
MAX_DESCRIPTION = 2000

# Hosts whose pages carry no Event block worth reading: AfroTech's own partner
# listings (already the source of those rows) and form builders.
SKIP_HOSTS = {"afrotechconference.com", "www.afrotechconference.com", "forms.cloud.microsoft", "docs.google.com"}

LD_JSON = re.compile(
    r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>", re.I | re.S
)
# Only real HTML tags, so text such as "Bring <your laptop>" keeps its words.
TAG = re.compile(r"</?(?:p|br|div|span|b|strong|i|em|u|a|ul|ol|li|h[1-6]|blockquote|img)\b[^>]*>", re.I)


# --- Reading a page ---------------------------------------------------------

def json_ld_blocks(page):
    """Every JSON-LD block on the page that parses."""
    blocks = []
    for raw in LD_JSON.findall(page):
        text = raw.strip()
        if text.startswith("<!--"):
            text = text.strip("<!->").strip()
        try:
            blocks.append(json.loads(text))
        except json.JSONDecodeError:
            try:
                blocks.append(json.loads(html.unescape(text)))
            except json.JSONDecodeError:
                continue
    return blocks


def is_event(node):
    kind = node.get("@type")
    kinds = kind if isinstance(kind, list) else [kind]
    # Event, SocialEvent, MusicEvent, BusinessEvent, EducationEvent, …
    return any(isinstance(k, str) and k.endswith("Event") for k in kinds)


def find_event(node, lists=False):
    """The first schema.org Event in a JSON-LD value, or None.

    Pages put their own event at the top level, in @graph or as mainEntity;
    lists such as "more events from this organiser" come only as a fallback
    (lists=True), so another event's details are never taken for this one.
    """
    keys = ("@graph", "mainEntity") + (("itemListElement", "item") if lists else ())
    if isinstance(node, list):
        for item in node:
            found = find_event(item, lists)
            if found:
                return found
    elif isinstance(node, dict):
        if is_event(node) and node.get("startDate"):
            return node
        for key in keys:
            if key in node:
                found = find_event(node[key], lists)
                if found:
                    return found
    return None


def text_of(value):
    """Plain text from a JSON-LD string, which may hold HTML or entities."""
    if not isinstance(value, str):
        return ""
    text = TAG.sub(" ", html.unescape(value))
    return re.sub(r"\s+", " ", text).strip()


def houston_iso(value):
    """'2026-11-03T23:00:00.000Z' → '2026-11-03T17:00:00-06:00', or None."""
    if not isinstance(value, str) or "T" not in value:
        return None
    try:
        dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)  # a page without an offset means local time
    return dt.astimezone(TZ).replace(microsecond=0).isoformat()


def first(value):
    return value[0] if isinstance(value, list) and value else value


def address_of(location):
    """(venue name, one-line street address) from a JSON-LD location."""
    location = first(location)
    if isinstance(location, str):
        return "", text_of(location)
    if not isinstance(location, dict):
        return "", ""
    # Online-only events have a VirtualLocation and no street address.
    if location.get("@type") == "VirtualLocation":
        return "Online", ""
    name = text_of(location.get("name"))
    addr = first(location.get("address"))
    if isinstance(addr, str):
        return name, text_of(addr)
    if not isinstance(addr, dict):
        return name, ""
    region = " ".join(p for p in (text_of(addr.get("addressRegion")), text_of(addr.get("postalCode"))) if p)
    parts = [text_of(addr.get("streetAddress")), text_of(addr.get("addressLocality")), region]
    return name, ", ".join(p for p in parts if p)


def money(amount, currency):
    try:
        n = float(amount)
    except (TypeError, ValueError):
        return None
    if n == 0:
        return "Free"
    symbol = "$" if (currency or "USD") == "USD" else f"{currency} "
    return f"{symbol}{n:,.2f}".replace(".00", "")


def price_of(event):
    """'Free', '$25' or '$10–$40', from offers; None when the page doesn't say."""
    if event.get("isAccessibleForFree") is True:
        return "Free"
    offers = event.get("offers")
    offers = offers if isinstance(offers, list) else [offers] if offers else []
    lows, highs = [], []
    currency = None
    for o in offers:
        if not isinstance(o, dict):
            continue
        currency = currency or o.get("priceCurrency")
        if "lowPrice" in o or "highPrice" in o:
            lows.append(o.get("lowPrice", o.get("highPrice")))
            highs.append(o.get("highPrice", o.get("lowPrice")))
        elif "price" in o:
            lows.append(o["price"])
            highs.append(o["price"])
    values = [float(v) for v in lows + highs if isinstance(v, (int, float, str)) and re.fullmatch(r"\d+(\.\d+)?", str(v))]
    if not values:
        return None
    lo, hi = min(values), max(values)
    if lo == hi:
        return money(lo, currency)
    return f"{money(lo, currency)}–{money(hi, currency)}"


def organizer_of(event):
    org = first(event.get("organizer"))
    if isinstance(org, dict):
        return text_of(org.get("name"))
    return text_of(org)


STATUS = {"EventCancelled": "cancelled", "EventPostponed": "postponed", "EventRescheduled": "rescheduled",
          "EventMovedOnline": "moved online"}


def status_of(event):
    raw = str(event.get("eventStatus") or "")
    return next((v for k, v in STATUS.items() if raw.endswith(k)), None)


def read_event(page):
    """What a page's Event block says, in our field names, or None."""
    blocks = json_ld_blocks(page)
    event = next((e for e in (find_event(b) for b in blocks) if e), None)
    event = event or next((e for e in (find_event(b, lists=True) for b in blocks) if e), None)
    if not event:
        return None
    venue, address = address_of(event.get("location"))
    description = text_of(event.get("description"))
    if len(description) > MAX_DESCRIPTION:
        description = description[:MAX_DESCRIPTION].rsplit(" ", 1)[0] + "…"
    found = {
        "title": text_of(event.get("name")) or None,
        "start": houston_iso(event.get("startDate")),
        # A date with no time (an all-day listing) is kept as just the date.
        "startDay": str(event["startDate"])[:10] if not houston_iso(event.get("startDate")) and re.fullmatch(
            r"\d{4}-\d{2}-\d{2}", str(event.get("startDate"))[:10]) else None,
        "end": houston_iso(event.get("endDate")),
        "venue": venue or None,
        "address": address or None,
        "price": price_of(event),
        "organizer": organizer_of(event) or None,
        "description": description or None,
        "status": status_of(event),
    }
    return {k: v for k, v in found.items() if v is not None}


# --- Which pages, and the cache ---------------------------------------------

def side_event_links():
    """Unique http(s) links from the side-event list, in list order."""
    with open(SIDE_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    links = []
    for r in rows:
        url = (r.get("rsvp") or "").strip()
        if url.startswith(("https://", "http://")) and url not in links:
            links.append(url)
    return links


def now_utc():
    return datetime.now(timezone.utc).replace(microsecond=0)


def stale(entry, now):
    try:
        checked = datetime.fromisoformat(entry["checkedAt"])
        if checked.tzinfo is None:
            checked = checked.replace(tzinfo=timezone.utc)
        return now - checked >= FRESH_FOR
    except (KeyError, TypeError, ValueError):
        return True


def main(argv):
    force = "--force" in argv
    path = ROOT / OUT
    cache = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    pages = cache.get("pages", {})
    now = now_utc()
    links = side_event_links()
    tried = read = failed = out_of_time = 0

    for url in links:
        host = urlparse(url).netloc.lower()
        entry = pages.get(url, {})
        if host in SKIP_HOSTS:
            if not entry.get("skipped"):  # written once, so the file doesn't change every run
                pages[url] = {"checkedAt": now.isoformat(), "skipped": "no event block expected on this site"}
            continue
        if not force and not stale(entry, now):
            continue
        if now_utc() - now > RUN_BUDGET:
            out_of_time += 1
            continue
        if tried:
            time.sleep(PAUSE_SECONDS)
        tried += 1
        try:
            event = read_event(fetch(url, timeout=FETCH_TIMEOUT))
        except (OSError, http.client.HTTPException, UnicodeDecodeError, ValueError) as err:
            failed += 1
            # Keep the last good result, and wait a day before trying again.
            pages[url] = {**entry, "checkedAt": now.isoformat(), "lastError": str(err)[:200]}
            continue
        except Exception as err:  # an odd page must not stop the run
            failed += 1
            pages[url] = {**entry, "checkedAt": now.isoformat(), "lastError": f"couldn't read the page: {err!r}"[:200]}
            continue
        read += 1
        pages[url] = {"checkedAt": now.isoformat(), "event": event} if event else {
            "checkedAt": now.isoformat(), "event": None, "note": "no schema.org Event block on the page"}

    # Pages no longer linked from the list drop out.
    pages = {u: pages[u] for u in links if u in pages}
    if tried and not read:
        # Not an error for the refresh Action: the other sources still update.
        print(f"Read none of {tried} event pages (network down, or the sites refuse scripts); "
              f"keeping {OUT} as it was.", file=sys.stderr)
        return
    write_text(OUT, json.dumps({"_about": __doc__.strip().splitlines()[0], "pages": pages}, indent=2,
                               ensure_ascii=False, sort_keys=True) + "\n")
    found = sum(1 for p in pages.values() if p.get("event"))
    print(f"event pages: {len(links)} links, {tried} fetched, {failed} failed, {found} with an event block"
          + (f", {out_of_time} left for the next run" if out_of_time else ""))


if __name__ == "__main__":
    main(sys.argv[1:])
