"""Helpers shared by the update scripts."""
import csv
import os
import re
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
TZ = ZoneInfo("America/Chicago")  # Houston
USER_AGENT = "afrotech-notes/1.0"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def clock(dt):
    """2:30 PM. Built by hand because %-I isn't portable to Windows."""
    return f"{dt.hour % 12 or 12}:{dt.minute:02d} {'AM' if dt.hour < 12 else 'PM'}"


def short_date(d):
    """Wed, Nov 4."""
    return f"{d:%a}, {d:%b} {d.day}"


def first_time(text):
    """Pull the first '6:00 PM'-style time out of free text, normalised, or ''."""
    m = re.search(r"(\d{1,2}):(\d{2})\s*([AP])\.?M", text or "", re.I)
    return f"{int(m[1])}:{m[2]} {m[3].upper()}M" if m else ""


def cell(text):
    """Make text safe for one markdown table cell."""
    return re.sub(r"\s+", " ", str(text or "").replace("|", "\\|")).strip()


def link(label, url):
    """Markdown link that survives spaces and parentheses in the URL."""
    return f"[{label}](<{url.strip()}>)" if url and url.strip() else ""


def write_text(path, text):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_csv(path, rows, fieldnames):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def guard_shrink(what, new_count, old_count, limit=0.2):
    """Stop before writing if a source suddenly returns far fewer items.

    A source that answers with partial data (a truncated payload, a login page
    instead of the sheet) would otherwise replace good data with a fraction of
    it. Set ALLOW_SHRINK=1 to accept a real drop.
    """
    if os.environ.get("ALLOW_SHRINK") == "1" or not old_count:
        return
    if new_count < old_count * (1 - limit):
        sys.exit(
            f"{what}: {new_count} now vs {old_count} saved, a drop of more than "
            f"{limit:.0%}. Keeping the existing files. If the drop is real, "
            "re-run with ALLOW_SHRINK=1."
        )
