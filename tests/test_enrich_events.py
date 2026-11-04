"""Tests for scripts/enrich_events.py's page reader (plan 0008, todo 033).

    python3 -m unittest discover -s tests -p "test_*.py"

The sandbox that wrote these can't reach posh.vip, Eventbrite or Luma, so the
pages below are built to the shapes those sites publish (schema.org Event
JSON-LD), not saved copies. The refresh Action's first run is the real check.
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import enrich_events as ee  # noqa: E402


def page(*blocks):
    scripts = "".join(f'<script type="application/ld+json">{b}</script>' for b in blocks)
    return f"<html><head><title>x</title>{scripts}</head><body>…</body></html>"


EVENTBRITE = page("""{
  "@context": "https://schema.org", "@type": "BusinessEvent",
  "name": "Founders &amp; Funders Mixer",
  "startDate": "2026-11-04T18:00:00-06:00", "endDate": "2026-11-04T21:00:00-06:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {"@type": "Place", "name": "The Ion",
    "address": {"@type": "PostalAddress", "streetAddress": "4201 Main St",
      "addressLocality": "Houston", "addressRegion": "TX", "postalCode": "77002", "addressCountry": "US"}},
  "offers": [{"@type": "AggregateOffer", "lowPrice": "0.00", "highPrice": "25.00", "priceCurrency": "USD"}],
  "organizer": {"@type": "Organization", "name": "Houston Founders"},
  "description": "<p>Meet founders and investors.</p><p>Drinks provided.</p>"
}""")

LUMA = page(
    '{"@context":"https://schema.org","@type":"Organization","name":"Luma"}',
    """{"@context":"https://schema.org","@type":"Event","name":"AI Builders Night",
      "startDate":"2026-11-03T23:00:00.000Z","endDate":"2026-11-04T02:00:00.000Z",
      "location":{"@type":"Place","name":"Station Houston","address":"1301 Fannin St, Houston, TX 77002"},
      "offers":[{"@type":"Offer","price":0,"priceCurrency":"USD"}],
      "organizer":[{"@type":"Person","name":"Ada"}]}""",
)

POSH = page("""{"@context":"http://schema.org","@graph":[
  {"@type":"WebPage","name":"Posh"},
  {"@type":"MusicEvent","name":"Afrobeats After Dark","startDate":"2026-11-05T22:00:00-06:00",
   "location":{"@type":"Place","name":"Spire","address":{"streetAddress":"1720 Main St","addressLocality":"Houston","addressRegion":"TX"}},
   "offers":{"@type":"Offer","price":"20","priceCurrency":"USD"},
   "eventStatus":"https://schema.org/EventCancelled"}]}""")

# posh.vip (Next.js): the Event block is text inside streamed chunks. This
# mirrors a real posh.vip page's shape, trimmed.
_LD = (
    '{"@context":"https://schema.org","@type":"Event","name":"The Green Room",'
    '"startDate":"2026-11-01T16:00:00-06:00","endDate":"2026-11-01T19:00:00-06:00",'
    '"location":{"@type":"Place","name":"Sanctuary Eado","address":{"@type":"PostalAddress",'
    '"streetAddress":"2108 Leeland St, Houston, TX 77003, USA","addressLocality":"","addressRegion":""}},'
    '"offers":{"@type":"Offer","price":0,"priceCurrency":"USD"},'
    '"organizer":{"@type":"Organization","name":"Mingle & Muse"}}'
)
NEXT_PAGE = (
    "<html><script>self.__next_f.push([1," + json.dumps('1:"$Sreact.fragment"\n') + "])</script>"
    "<script>self.__next_f.push([1," + json.dumps("3e:T5a0," + _LD[:120]) + "])</script>"
    "<script>self.__next_f.push([1," + json.dumps(_LD[120:] + '\n23:["$","script",null,{}]') + "])</script></html>"
)


class ReadEvent(unittest.TestCase):
    def test_eventbrite_shape(self):
        e = ee.read_event(EVENTBRITE)
        self.assertEqual(e["title"], "Founders & Funders Mixer")
        self.assertEqual(e["start"], "2026-11-04T18:00:00-06:00")
        self.assertEqual(e["end"], "2026-11-04T21:00:00-06:00")
        self.assertEqual(e["venue"], "The Ion")
        self.assertEqual(e["address"], "4201 Main St, Houston, TX 77002")
        self.assertEqual(e["price"], "Free–$25")
        self.assertEqual(e["organizer"], "Houston Founders")
        self.assertEqual(e["description"], "Meet founders and investors. Drinks provided.")
        self.assertNotIn("status", e)

    def test_luma_shape_utc_times_and_string_address(self):
        e = ee.read_event(LUMA)
        self.assertEqual(e["title"], "AI Builders Night")
        self.assertEqual(e["start"], "2026-11-03T17:00:00-06:00")  # 23:00 UTC is 5 PM in Houston
        self.assertEqual(e["end"], "2026-11-03T20:00:00-06:00")
        self.assertEqual(e["address"], "1301 Fannin St, Houston, TX 77002")
        self.assertEqual(e["price"], "Free")
        self.assertEqual(e["organizer"], "Ada")

    def test_posh_shape_graph_cancelled_no_end(self):
        e = ee.read_event(POSH)
        self.assertEqual(e["title"], "Afrobeats After Dark")
        self.assertNotIn("end", e)
        self.assertEqual(e["address"], "1720 Main St, Houston, TX")
        self.assertEqual(e["price"], "$20")
        self.assertEqual(e["status"], "cancelled")

    def test_posh_next_js_streamed_block(self):
        e = ee.read_event(NEXT_PAGE)
        self.assertEqual(e["title"], "The Green Room")
        self.assertEqual((e["start"], e["end"]), ("2026-11-01T16:00:00-06:00", "2026-11-01T19:00:00-06:00"))
        self.assertEqual((e["venue"], e["address"]), ("Sanctuary Eado", "2108 Leeland St, Houston, TX 77003, USA"))
        self.assertEqual((e["price"], e["organizer"]), ("Free", "Mingle & Muse"))

    def test_next_js_block_with_context_not_first_and_a_bad_chunk(self):
        ld = '{"@type":"Event","location":{"@type":"Place","name":"Spire"},"@context":"https://schema.org",' \
             '"name":"Late Key","startDate":"2026-11-05T22:00:00-06:00"}'
        page_ = ("<script>self.__next_f.push([1,\"\\x41 bad\"])</script>"
                 "<script>self.__next_f.push([1," + json.dumps("3e:T10," + ld) + "])</script>")
        e = ee.read_event(page_)
        self.assertEqual((e["title"], e["venue"]), ("Late Key", "Spire"))

    def test_no_event_block(self):
        self.assertIsNone(ee.read_event(page('{"@type":"Organization","name":"x"}')))
        self.assertIsNone(ee.read_event("<html>no json-ld</html>"))
        self.assertIsNone(ee.read_event(page("{not json")))

    def test_online_event_has_no_address(self):
        e = ee.read_event(page('{"@type":"Event","name":"Webinar","startDate":"2026-11-02T12:00:00-06:00",'
                               '"location":{"@type":"VirtualLocation","url":"https://zoom.us/j/1"}}'))
        self.assertEqual(e["venue"], "Online")
        self.assertNotIn("address", e)

    def test_long_description_is_cut_at_a_word(self):
        long = "word " * 1000
        e = ee.read_event(page('{"@type":"Event","name":"x","startDate":"2026-11-02T12:00:00-06:00",'
                               f'"description":"{long}"}}'))
        self.assertLessEqual(len(e["description"]), ee.MAX_DESCRIPTION + 1)
        self.assertTrue(e["description"].endswith("…"))

    def test_own_event_wins_over_a_list_of_other_events(self):
        listing = ('{"@type":"ItemList","itemListElement":[{"@type":"ListItem","item":'
                   '{"@type":"Event","name":"Someone else","startDate":"2026-11-01T10:00:00-06:00"}}]}')
        own = '{"@type":"Event","name":"This one","startDate":"2026-11-04T18:00:00-06:00"}'
        self.assertEqual(ee.read_event(page(listing, own))["title"], "This one")
        # With nothing else on the page, a listed event is still used.
        self.assertEqual(ee.read_event(page(listing))["title"], "Someone else")

    def test_date_only_start_is_kept_as_a_day(self):
        e = ee.read_event(page('{"@type":"Event","name":"All day","startDate":"2026-11-04"}'))
        self.assertNotIn("start", e)
        self.assertEqual(e["startDay"], "2026-11-04")

    def test_angle_brackets_in_plain_text_survive(self):
        e = ee.read_event(page('{"@type":"Event","name":"x","startDate":"2026-11-02T12:00:00-06:00",'
                               '"description":"Bring <your laptop> and <b>ideas</b>"}'))
        self.assertEqual(e["description"], "Bring <your laptop> and ideas")

    def test_contact_details_are_removed(self):
        e = ee.read_event(page('{"@type":"Event","name":"x","startDate":"2026-11-02T12:00:00-06:00",'
                               '"description":"Questions? Email jane.doe@gmail.com or text (713) 555-0142, ok."}'))
        self.assertEqual(e["description"], "Questions? Email or text, ok.")

    def test_street_address_holding_the_city_is_not_repeated(self):
        e = ee.read_event(page('{"@type":"Event","name":"x","startDate":"2026-11-02T12:00:00-06:00",'
                               '"location":{"@type":"Place","name":"Us","address":{"streetAddress":'
                               '"808 Travis Street, Houston, TX 77002","addressLocality":"Houston","addressRegion":"TX"}}}'))
        self.assertEqual(e["address"], "808 Travis Street, Houston, TX 77002")


class Cache(unittest.TestCase):
    def test_stale_handles_missing_naive_and_bad_times(self):
        now = ee.now_utc()
        self.assertTrue(ee.stale({}, now))
        self.assertTrue(ee.stale({"checkedAt": None}, now))
        self.assertTrue(ee.stale({"checkedAt": "nonsense"}, now))
        self.assertFalse(ee.stale({"checkedAt": now.replace(tzinfo=None).isoformat()}, now))
        self.assertFalse(ee.stale({"checkedAt": now.isoformat()}, now))


if __name__ == "__main__":
    unittest.main()
