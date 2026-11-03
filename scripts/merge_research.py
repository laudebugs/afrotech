#!/usr/bin/env python3
"""Merge a batch of speaker research into data/sources/speaker-research.json
and print a Markdown review table.

    python3 scripts/merge_research.py batch-1.json [batch-2.json ...] > review.md

Each batch file maps speaker id -> entry, in the shape that file's _about
describes. Existing entries are replaced by the batch's (rows keep their
status; a reviewer flips "draft" to "approved" or "rejected" by hand).
"""
import json
import sys

from common import ROOT

RESEARCH = ROOT / "data/sources/speaker-research.json"
BLOCKLIST_HINT = ("spokeo", "zoominfo", "rocketreach", "apollo.io", "contactout", "lusha", "whitepages",
                  "beenverified", "radaris", "mylife", "theorg", "signalhire", "idcrawl", "linkedin.com")


def cell(text):
    return str(text or "").replace("|", "\\|").replace("\n", " ").strip()


def main():
    data = json.loads(RESEARCH.read_text(encoding="utf-8"))
    speakers = data.setdefault("speakers", {})
    batch = {}
    for path in sys.argv[1:]:
        batch.update(json.loads(open(path, encoding="utf-8").read()))

    rows, skipped = [], []
    for sid, entry in batch.items():
        # Never trust a batch to set approval: everything arrives as a draft.
        for row in entry.get("facts", []) + entry.get("articles", []) + ([entry["website"]] if entry.get("website") else []):
            row["status"] = "draft"
            url = row.get("url", "")
            if not url.startswith("https://") or any(b in url for b in BLOCKLIST_HINT):
                row["status"] = "rejected"
                row["rejectedBecause"] = "not https or blocklisted source"
        speakers[sid] = entry
        name, score = entry.get("name", sid), entry.get("identity", {}).get("score", "?")
        if not entry.get("facts") and not entry.get("articles") and not entry.get("website"):
            skipped.append(f"{name} ({score}): {entry.get('notes', 'nothing found')}")
        for f in entry.get("facts", []):
            rows.append(f"| {cell(name)} | {score} | Fact | {cell(f.get('text'))} | [{cell(f.get('publisher') or 'source')}]({f.get('url')}) | {f.get('tier', '')} | {f.get('quote_seen_in', '')} | {f['status']} |")
        for a in entry.get("articles", []):
            rows.append(f"| {cell(name)} | {score} | {cell((a.get('kind') or 'article').title())} | {cell(a.get('title'))} | [{cell(a.get('publisher') or 'source')}]({a.get('url')}) | | {a.get('quote_seen_in', '')} | {a['status']} |")
        if entry.get("website"):
            w = entry["website"]
            rows.append(f"| {cell(name)} | {score} | Website | {cell(w.get('url'))} | [site]({w.get('url')}) | 3 | {w.get('quote_seen_in', '')} | {w['status']} |")

    RESEARCH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("| Speaker | Identity | Kind | Fact or title | Source | Tier | Quote seen in | Status |")
    print("|---|---|---|---|---|---|---|---|")
    print("\n".join(rows))
    if skipped:
        print("\n**Nothing published-worthy found:**\n")
        print("\n".join(f"- {s}" for s in skipped))


if __name__ == "__main__":
    main()
