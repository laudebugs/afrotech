#!/usr/bin/env python3
"""Look up side-event addresses on Nominatim and cache them in data/geocode.json.

Only addresses missing from the cache are looked up, one per second, as
Nominatim's usage policy asks (https://operations.osmfoundation.org/policies/nominatim/).
A result is kept only when it is a real place in the Houston area: a building,
an address with a house number, or a named venue. Placeholders like "Address
shared 24 hrs before" or "TBA, Houston" would otherwise land on the city
centre, so those are cached as not found and the site lists them without a pin.

Run it after update_side_events.py; the refresh workflow does.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

from common import ROOT, USER_AGENT, write_text

CACHE = ROOT / "data/geocode.json"
SEARCH = "https://nominatim.openstreetmap.org/search"
# Greater Houston, as west, north, east, south.
HOUSTON_BOX = (-95.90, 30.15, -94.95, 29.50)
# Result categories too broad to pin without a house number: a city or county
# (boundary, place) or a whole street (highway), which can be miles long.
TOO_BROAD = {"boundary", "place", "highway"}
# Suite and unit parts Nominatim can't parse: ", Suite 200", " Ste 150", "#400".
UNIT = re.compile(r",?\s*(?:#\s*)?\b(?:suite|ste|unit)\b\.?\s*[\w-]+|\s#\s?[\w-]+|,?\s*United States\b", re.I)


def clean(address):
    """The address without suite or unit numbers, which Nominatim can't match."""
    return re.sub(r"\s{2,}", " ", UNIT.sub("", address)).strip(" ,")


# Words that mark an address as a placeholder, not a location.
PLACEHOLDERS = ("shared", "tba", "tbd", "approved", "rsvp", "dm for", "upon", "announced")
# Bump when the matching rules change, so earlier misses get another try.
RULES = 2


def lookup(address):
    params = {
        "q": clean(address),
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 1,
        "countrycodes": "us",
        "viewbox": ",".join(str(n) for n in HOUSTON_BOX),
        "bounded": 1,
    }
    req = urllib.request.Request(
        f"{SEARCH}?{urllib.parse.urlencode(params)}",
        headers={"User-Agent": f"{USER_AGENT} (github.com/laudebugs/afrotech)"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        results = json.loads(r.read().decode("utf-8"))
    if not results:
        return {"found": False, "why": "no match in the Houston area"}
    hit = results[0]
    precise = "house_number" in hit.get("address", {}) or hit.get("category") not in TOO_BROAD
    if not precise:
        return {"found": False, "why": f"only matched a {hit.get('type', 'region')}"}
    return {
        "found": True,
        "lat": round(float(hit["lat"]), 6),
        "lng": round(float(hit["lon"]), 6),
        "match": hit.get("display_name", "")[:120],
    }


def main():
    events = json.loads((ROOT / "data/events/side.json").read_text(encoding="utf-8"))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    wanted = sorted({e["address"].strip() for e in events if e.get("address")})
    # New addresses, plus earlier misses worth retrying under the current rules.
    retry = {a for a in wanted if not cache.get(a, {}).get("found") and cache.get(a, {}).get("rules") != RULES}
    todo = [a for a in wanted if a not in cache or a in retry]
    print(f"{len(wanted)} addresses, {len(todo)} new to look up.")
    for i, address in enumerate(todo):
        if any(word in address.lower() for word in PLACEHOLDERS) and not any(c.isdigit() for c in address):
            cache[address] = {"found": False, "why": "placeholder, not an address", "rules": RULES}
            continue
        try:
            cache[address] = {**lookup(address), "rules": RULES}
        except Exception as err:  # network trouble: leave it uncached and try next run
            print(f"  skipped {address!r}: {err}", file=sys.stderr)
        if i < len(todo) - 1:
            time.sleep(1.1)  # at most one request per second
    found = sum(1 for a in wanted if cache.get(a, {}).get("found"))
    write_text("data/geocode.json", json.dumps(dict(sorted(cache.items())), indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote data/geocode.json: {found} of {len(wanted)} addresses placed.")


if __name__ == "__main__":
    main()
