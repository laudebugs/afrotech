#!/usr/bin/env python3
"""Check researched speaker facts against their sources.

For every fact, article and website in data/sources/speaker-research.json:
  - the domain isn't on the blocklist (people-search sites, contact brokers);
  - the URL loads (HTTP 200) and doesn't redirect to a home page;
  - the page contains the identity quote (it's about this person) and the
    claim quote (it supports the fact), ignoring case, spacing and quote marks.

Prints a table and exits non-zero if any *approved* row fails, so a broken
source can't stay published. Draft rows are reported, not enforced.

    python3 scripts/check_research.py            # every speaker
    python3 scripts/check_research.py morgan-debaun   # one speaker, by slug
"""
import html
import json
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

from common import ROOT, USER_AGENT

RESEARCH = ROOT / "data/sources/speaker-research.json"

# Never cite these: people-search sites, contact brokers and bio farms
# (see reports/Speaker profile research sources.md).
BLOCKLIST = {
    "spokeo.com", "zoominfo.com", "rocketreach.co", "apollo.io", "contactout.com",
    "lusha.com", "whitepages.com", "beenverified.com", "radaris.com", "mylife.com",
    "peoplefinders.com", "truepeoplesearch.com", "fastpeoplesearch.com", "signalhire.com",
    "clay.com", "theorg.com", "idcrawl.com", "celebsagewiki.com", "networthspot.com",
}


def normalise(text):
    text = text.lower().replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = text.replace("–", "-").replace("—", "-").replace(" ", " ")
    return re.sub(r"\s+", " ", text).strip()


def page_text(raw):
    raw = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", raw)
    return normalise(html.unescape(re.sub(r"<[^>]+>", " ", raw)))


def blocked(url):
    host = urlparse(url).netloc.lower().removeprefix("www.")
    return any(host == b or host.endswith("." + b) for b in BLOCKLIST)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
    with urllib.request.urlopen(req, timeout=20) as res:
        final = res.geturl()
        body = res.read(3_000_000).decode(res.headers.get_content_charset() or "utf-8", "replace")
        return res.status, final, body


def check_row(row, cache):
    url = row.get("url", "")
    if not url.startswith("https://"):
        return "not https"
    if blocked(url):
        return "blocklisted domain"
    if url not in cache:
        try:
            cache[url] = fetch(url)
        except urllib.error.HTTPError as err:
            cache[url] = (err.code, url, "")
        except Exception as err:  # network errors, timeouts, TLS
            cache[url] = (0, url, f"__error__ {type(err).__name__}")
    status, final, body = cache[url]
    if body.startswith("__error__"):
        return f"couldn't load ({body.split(' ', 1)[1]})"
    if status != 200:
        return f"HTTP {status}"
    if urlparse(final).path in ("", "/") and urlparse(url).path not in ("", "/"):
        return "redirected to a home page"
    text = page_text(body)
    for field in ("identity_quote", "claim_quote"):
        quote = row.get(field)
        if quote and normalise(quote) not in text:
            return f"{field} not on the page"
    return None


def main():
    data = json.loads(RESEARCH.read_text(encoding="utf-8"))
    only = sys.argv[1] if len(sys.argv) > 1 else None
    cache, failures, checked = {}, 0, 0
    for sid, entry in data.get("speakers", {}).items():
        if only and entry.get("slug") != only:
            continue
        rows = [("fact", r) for r in entry.get("facts", [])] + [("article", r) for r in entry.get("articles", [])]
        if entry.get("website"):
            rows.append(("website", entry["website"]))
        for kind, row in rows:
            problem = check_row(row, cache)
            checked += 1
            status = row.get("status", "draft")
            label = row.get("text") or row.get("title") or row.get("url")
            mark = "ok  " if not problem else ("FAIL" if status == "approved" else "warn")
            if problem and status == "approved":
                failures += 1
            print(f"{mark} {entry.get('name', sid)[:28]:28} {kind:7} {status:8} {str(label)[:60]:60} {problem or ''}")
    print(f"\nChecked {checked} rows; {failures} approved rows failed.")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
