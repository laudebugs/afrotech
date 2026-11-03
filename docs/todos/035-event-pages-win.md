# 035 — Event pages win on name, date, times and location

**Status:** done · **Plan:** [Plan 0008](../plans/0008-event-pages-and-maps-apps.md) · **Depends on:** 034

## Goal

Check every side event against its own page and use the page's name, date, times and location; remove our location when the page has none.

## Done when

- [x] A read page's name, date, start, end and location replace the lists' when they differ
- [x] A read page with no location removes ours
- [x] Price and description still only fill gaps
- [x] Unread pages, pages without an Event block, and series links change nothing
- [x] Ids stay the same after a rename or move
- [x] Every change is listed in `schedule/side-events.md`

## Notes

Built on November 3, at your request. "St" and "Street", or a name differing
only in case or punctuation, count as the same, so they don't churn. A
cancellation is listed for review but doesn't hide the event.

Review fixes:

- A page showing a date outside the week (a recurring event's next date)
  changes nothing and is listed.
- A page with only a city, or a venue name without an address, as many show
  until you RSVP, doesn't replace our street address.
- Convention-center events keep their venue and map spot.
- A new start with no usable end clears our old end.
- A venue with no address is removed like any other when the page has no
  location.
- A missing address fills quietly.
- Ticket-site branding is dropped from names.
- The day tables in `schedule/side-events.md` show events as the site does.

34 Python tests cover the rules. The first real check against the pages is the refresh
Action's next run.
