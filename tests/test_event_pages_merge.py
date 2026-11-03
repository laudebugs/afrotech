"""Tests for build_events.apply_event_pages (plan 0008, todo 034): pages only
fill what the community lists leave empty, and disagreements are reported."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import build_events as be  # noqa: E402

URL = "https://posh.vip/e/x"


def row(**kw):
    base = {"date": "2026-11-04", "start": "6:00 PM", "end": "", "event": "Mixer", "host": "", "venue": "",
            "address": "", "price": "", "type": "", "categories": "", "rsvp": URL, "registration": "",
            "founder_investor_pick": "", "description": "", "source": "afrotech.guide"}
    return {**base, **kw}


def pages(**event):
    base = {"start": "2026-11-04T18:00:00-06:00", "end": "2026-11-04T21:00:00-06:00", "venue": "The Ion",
            "address": "4201 Main St, Houston, TX 77002", "price": "$25", "description": "Meet founders."}
    return {URL: {"event": {**base, **event}}}


class Merge(unittest.TestCase):
    def test_fills_empty_fields_and_credits_the_page(self):
        (r,), diffs = be.apply_event_pages([row()], pages())
        self.assertEqual((r["end"], r["venue"], r["address"], r["price"], r["description"]),
                         ("9:00 PM", "The Ion", "4201 Main St, Houston, TX 77002", "$25", "Meet founders."))
        self.assertEqual(r["source"], "afrotech.guide, event page")
        self.assertEqual(diffs, [])

    def test_list_values_win(self):
        original = row(end="8:00 PM", venue="Ion", address="4201 Main", price="Free", description="Ours")
        (r,), _ = be.apply_event_pages([original], pages())
        self.assertEqual(r, original)

    def test_original_row_is_not_changed(self):
        original = row()
        be.apply_event_pages([original], pages())
        self.assertEqual(original["address"], "")

    def test_different_start_is_reported_and_end_not_filled(self):
        (r,), diffs = be.apply_event_pages([row(start="7:00 PM")], pages())
        self.assertEqual(r["end"], "")
        self.assertEqual([(d["field"], d["list"], d["page"]) for d in diffs], [("start", "7:00 PM", "6:00 PM")])

    def test_other_day_fills_nothing(self):
        (r,), diffs = be.apply_event_pages([row()], pages(start="2026-11-05T18:00:00-06:00", end=None))
        self.assertEqual(r["address"], "")
        self.assertEqual(diffs[0]["field"], "date")

    def test_cancelled_is_reported(self):
        _, diffs = be.apply_event_pages([row()], pages(status="cancelled"))
        self.assertIn(("status", "cancelled"), [(d["field"], d["page"]) for d in diffs])

    def test_after_midnight_end_and_overlong_end(self):
        (r,), _ = be.apply_event_pages([row(start="10:00 PM")], pages(start="2026-11-04T22:00:00-06:00",
                                                                       end="2026-11-05T02:00:00-06:00"))
        self.assertEqual(r["end"], "2:00 AM")
        (r,), _ = be.apply_event_pages([row()], pages(end="2026-11-07T18:00:00-06:00"))
        self.assertEqual(r["end"], "")

    def test_missing_start_is_filled_from_the_page(self):
        (r,), _ = be.apply_event_pages([row(start="")], pages())
        self.assertEqual((r["start"], r["end"]), ("6:00 PM", "9:00 PM"))

    def test_online_venue_is_not_an_address(self):
        (r,), _ = be.apply_event_pages([row()], pages(venue="Online", address=None))
        self.assertEqual((r["venue"], r["address"]), ("", ""))

    def test_built_event_carries_the_filled_fields(self):
        filled, _ = be.apply_event_pages([row()], pages())
        (e,) = be.side_events(filled, {})
        self.assertEqual(e["end"], "2026-11-04T21:00:00-06:00")
        self.assertEqual(e["address"], "4201 Main St, Houston, TX 77002")
        self.assertIn("event page", e["sources"])

    def test_date_only_page_with_timed_end_does_not_crash(self):
        (r,), _ = be.apply_event_pages([row(start="")], {URL: {"event": {"startDay": "2026-11-04",
                                                                          "end": "2026-11-04T21:00:00-06:00"}}})
        self.assertEqual((r["start"], r["end"]), ("", ""))

    def test_venue_fills_only_with_the_address(self):
        (r,), _ = be.apply_event_pages([row(address="4201 Main St")], pages())
        self.assertEqual(r["venue"], "")

    def test_series_link_on_several_days_is_left_alone(self):
        rows = [row(), row(date="2026-11-05")]
        out, diffs = be.apply_event_pages(rows, pages())
        self.assertEqual(out, rows)
        self.assertEqual(diffs, [])

    def test_broken_pages_file_is_ignored(self):
        path = be.EVENT_PAGES
        saved = path.read_text() if path.exists() else None
        try:
            path.write_text("{ not json")
            self.assertEqual(be.load_event_pages(), {})
        finally:
            path.write_text(saved) if saved is not None else path.unlink()


if __name__ == "__main__":
    unittest.main()
