# Plan 0009: One search box finds any event, speaker or note across the week

**Status:** built 2026-11-04 (todos 036–039): search opens from the Schedule tab; events, speakers and notes; typo-tolerant (MiniSearch); all filters · **Created:** 2026-11-04

Today you can search and filter only one day at a time, on that day's Schedule
page. To find "the AI panel with the Google speaker" you have to guess the day
first, and there's no way to ask for "free things tonight" or "workshops on
Thursday morning". With 431 events across seven days, finding things is the
planner's most common job. This plan adds a search page that covers the whole
week, plus filters that work the same way there and on each day's schedule.

## Search opens from the Schedule tab

Each day's Schedule page gets a search box at the top. Tapping it opens
`/schedule/search/`, which keeps the Schedule tab highlighted and searches the
whole week. The day pages stay as light as they are, because the search data
loads only on the search page. The search page shows the box with the
keyboard up, a row of filter chips, and results grouped by day:

```
[ 🔍 ai panel                     ✕ ]
[Today] [Tonight] [Free] [Side events] [Filters · 2]

Wed, Nov 4
  10:30  The Future of AI at Work           Room 320   ☆
  2:00   Building With LLMs · Ada Lovelace  Hall A     ☆
Thu, Nov 5
  9:00   AI Startup Breakfast · side event  The Ion    ☆
```

Each result has a star, like the schedule, and opens the event. The address
holds the search (`/schedule/search/?q=ai&day=thu`), so back and forward work and a
search can be shared as a link. Before you type, the page offers your recent
searches (kept on this device) and the common filters.

## Search covers events, speakers and your notes

| Finds | By |
|-------|----|
| Events | Title, description, speakers and their companies, host, venue, address, track, category |
| Speakers | Name, title, company; opens their profile |
| Your notes | Title and text; read from this device, so they never leave it |

Matching ignores case and accents, and every word you type must match
somewhere, so "ai health" finds events about both. Word starts count, so
"entre" finds "entrepreneurship", and small typos are forgiven, so
"enterpreneur" does too. Results rank title matches first, then
speaker and host matches, then the rest, and within each, the soonest event
first. Events that have ended sink to the bottom.

## Filters narrow any search, or the whole week with no search at all

The chips under the box cover the most common filters, one tap each. A
**Filters** button opens a sheet with all of them, and the chips show which
are on.

| Filter | Choices |
|--------|---------|
| When | Now and next, Today, Tonight (after 5 PM), a day, or a time of day: morning, afternoon, evening, late night |
| Type | Official sessions, side events |
| Track | The 20 official tracks, such as Artificial Intelligence or Wealth |
| Kind of side event | Networking, Social, Party, Career, Workshop, Founder |
| Cost and access | Free, Open to all, Needs a badge, RSVP or invite |
| Where | At the convention center, nearby (walkable), or across Houston |
| Mine | In my plan, Doesn't clash with my plan |
| Picks | Founder & investor picks |

Each day's Schedule page keeps its filters, rebuilt on the same component, so
the two pages behave the same.

## It runs in the browser, so it's fast and works offline

The build writes one compact search file, `/search-index.json`, with what
search needs about each event and speaker: about 310 KB, or about 90 KB as
sent. The service worker saves it, so search works with no signal.
Searching runs in the browser as you type, with no server and no sign-in.
Notes are searched from the device and never sent anywhere.

Matching uses MiniSearch 7.2.0, a small search library (about 7 KB sent)
with prefix and typo-tolerant ("fuzzy") matching and field weights, so title
matches rank above description matches.

## Four todos

| # | Task |
|---|------|
| 036 | `/search-index.json` and the matching code, with tests |
| 037 | `/schedule/search/`: the box, results by day, recent searches, and the box on each day's page |
| 038 | The filter chips and sheet, shared with each day's Schedule page |
| 039 | Speakers and your notes in the results; offline |

Each todo ships on its own; 036 and 037 together give a working week-wide
search.

## Decided

On November 4 you chose: search opens from the Schedule tab; it finds events,
speakers and your notes; matching forgives typos (MiniSearch); and the filter
sheet offers all four groups above. "Walkable" means within 1.5 km of the
convention center.
