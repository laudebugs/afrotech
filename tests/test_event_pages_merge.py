"""Tests for build_events.apply_event_pages (plan 0008): an event's own page
wins on name, date, times and location; a read page with no location removes
ours; price and description only fill gaps; ids never change."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import build_events as be  # noqa: E402

URL = "https://posh.vip/e/x"


def row(**kw):
    base = {"date": "2026-11-04", "start": "6:00 PM", "end": "9:00 PM", "event": "Mixer", "host": "",
            "venue": "The Ion", "address": "4201 Main St, Houston, TX 77002", "price": "", "type": "",
            "categories": "", "rsvp": URL, "registration": "", "founder_investor_pick": "", "description": "",
            "source": "afrotech.guide"}
    return {**base, **kw}


def pages(**event):
    base = {"title": "Mixer", "start": "2026-11-04T18:00:00-06:00", "end": "2026-11-04T21:00:00-06:00",
            "venue": "The Ion", "address": "4201 Main Street, Houston, TX 77002", "price": "$25",
            "description": "Meet founders."}
    return {URL: {"event": {k: v for k, v in {**base, **event}.items() if v is not None}}}


def fields(r):
    return {k: r[k] for k in ("event", "date", "start", "end", "venue", "address")}


class PageWins(unittest.TestCase):
    def test_matching_page_changes_nothing_but_fills_gaps(self):
        (r,), changes = be.apply_event_pages([row()], pages())
        self.assertEqual(fields(r), fields(row()))  # "Street" vs "St" is the same place
        self.assertEqual((r["price"], r["description"]), ("$25", "Meet founders."))
        self.assertEqual(changes, [])

    def test_list_price_and_description_are_kept(self):
        (r,), _ = be.apply_event_pages([row(price="Free", description="Ours")], pages())
        self.assertEqual((r["price"], r["description"]), ("Free", "Ours"))

    def test_page_name_wins(self):
        (r,), changes = be.apply_event_pages([row(event="Mixr")], pages(title="Founders Mixer"))
        self.assertEqual(r["event"], "Founders Mixer")
        self.assertEqual([(c["field"], c["list"], c["page"]) for c in changes], [("name", "Mixr", "Founders Mixer")])

    def test_name_differing_only_in_case_or_punctuation_is_kept(self):
        (r,), changes = be.apply_event_pages([row(event="MIXER!")], pages())
        self.assertEqual(r["event"], "MIXER!")
        self.assertEqual(changes, [])

    def test_page_location_wins(self):
        (r,), changes = be.apply_event_pages([row()], pages(venue="Spire", address="1720 Main St, Houston, TX"))
        self.assertEqual((r["venue"], r["address"]), ("Spire", "1720 Main St, Houston, TX"))
        self.assertEqual(changes[0]["field"], "location")

    def test_no_location_on_the_page_removes_ours(self):
        (r,), changes = be.apply_event_pages([row()], pages(venue=None, address=None))
        self.assertEqual((r["venue"], r["address"]), ("", ""))
        self.assertEqual(changes[0]["page"], "none on the page (removed)")

    def test_online_page(self):
        (r,), _ = be.apply_event_pages([row()], pages(venue="Online", address=None))
        self.assertEqual((r["venue"], r["address"]), ("Online", ""))

    def test_page_times_and_date_win(self):
        (r,), changes = be.apply_event_pages(
            [row()], pages(start="2026-11-05T19:00:00-06:00", end="2026-11-05T23:30:00-06:00"))
        self.assertEqual((r["date"], r["start"], r["end"]), ("2026-11-05", "7:00 PM", "11:30 PM"))
        self.assertEqual({c["field"] for c in changes}, {"date", "start", "end"})

    def test_after_midnight_end_and_overlong_end(self):
        (r,), _ = be.apply_event_pages([row(start="10:00 PM", end="")],
                                       pages(start="2026-11-04T22:00:00-06:00", end="2026-11-05T02:00:00-06:00"))
        self.assertEqual(r["end"], "2:00 AM")
        (r,), _ = be.apply_event_pages([row()], pages(end="2026-11-07T18:00:00-06:00"))
        self.assertEqual(r["end"], "9:00 PM")

    def test_date_only_page_keeps_our_time(self):
        (r,), _ = be.apply_event_pages([row()], pages(start=None, end="2026-11-04T21:00:00-06:00",
                                                       startDay="2026-11-04"))
        self.assertEqual((r["start"], r["end"]), ("6:00 PM", "9:00 PM"))

    def test_cancelled_is_reported(self):
        _, changes = be.apply_event_pages([row()], pages(status="cancelled"))
        self.assertIn(("status", "cancelled"), [(c["field"], c["page"]) for c in changes])

    def test_venue_only_row_is_removed_when_page_has_no_location(self):
        (r,), changes = be.apply_event_pages([row(address="", venue="Secret Rooftop")], pages(venue=None, address=None))
        self.assertEqual((r["venue"], r["address"]), ("", ""))
        self.assertEqual(len(changes), 1)

    def test_city_only_or_venue_only_page_keeps_our_address(self):
        for page_loc in ({"venue": None, "address": "Houston, TX"}, {"venue": "Ion District", "address": None}):
            (r,), changes = be.apply_event_pages([row()], pages(**page_loc))
            self.assertEqual((r["venue"], r["address"]), ("The Ion", "4201 Main St, Houston, TX 77002"))
            self.assertEqual(changes, [])

    def test_convention_center_keeps_its_venue(self):
        grb = row(venue="George R. Brown Convention Center", address="1001 Avenida de las Americas, Houston, TX")
        (r,), _ = be.apply_event_pages([grb], pages(venue="GRB", address="1001 Avenida De Las Américas, Houston"))
        self.assertEqual(r["venue"], "George R. Brown Convention Center")

    def test_missing_address_is_filled_quietly(self):
        (r,), changes = be.apply_event_pages([row(address="")], pages())
        self.assertEqual(r["address"], "4201 Main Street, Houston, TX 77002")
        self.assertEqual(changes, [])

    def test_new_start_without_end_drops_our_end(self):
        (r,), _ = be.apply_event_pages([row()], pages(start="2026-11-04T22:00:00-06:00", end=None))
        self.assertEqual((r["start"], r["end"]), ("10:00 PM", ""))

    def test_page_outside_the_week_changes_nothing(self):
        original = row(event="Old name")
        (r,), changes = be.apply_event_pages([original], pages(title="New", start="2026-12-03T18:00:00-06:00"))
        self.assertEqual(r, original)
        self.assertIn("outside the week", changes[0]["page"])

    def test_ticket_site_branding_is_dropped_from_names(self):
        (r,), _ = be.apply_event_pages([row()], pages(title="Mixer | Eventbrite"))
        self.assertEqual(r["event"], "Mixer")


class LeftAlone(unittest.TestCase):
    def test_unread_page_or_no_event_block(self):
        original = row()
        self.assertEqual(be.apply_event_pages([original], {})[0], [original])
        self.assertEqual(be.apply_event_pages([original], {URL: {"event": None}})[0], [original])

    def test_series_link_on_several_days(self):
        rows = [row(), row(date="2026-11-05")]
        out, changes = be.apply_event_pages(rows, pages(title="Other", venue=None, address=None))
        self.assertEqual((out, changes), (rows, []))

    def test_original_row_is_not_changed(self):
        original = row()
        be.apply_event_pages([original], pages(title="Renamed", venue=None, address=None))
        self.assertEqual(original["event"], "Mixer")

    def test_broken_pages_file_is_ignored(self):
        path = be.EVENT_PAGES
        saved = path.read_text() if path.exists() else None
        try:
            path.write_text("{ not json")
            self.assertEqual(be.load_event_pages(), {})
        finally:
            path.write_text(saved) if saved is not None else path.unlink()


class Ids(unittest.TestCase):
    def test_id_survives_a_rename_and_a_move(self):
        (before,) = be.side_events([row()], {})
        moved, _ = be.apply_event_pages([row()], pages(title="New Name", start="2026-11-05T19:00:00-06:00",
                                                        end=None))
        (after,) = be.side_events(moved, {})
        self.assertEqual(after["id"], before["id"])
        self.assertEqual((after["title"], after["date"]), ("New Name", "2026-11-05"))
        self.assertIn("event page", after["sources"])


if __name__ == "__main__":
    unittest.main()
