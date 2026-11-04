# Plan 0009: One search box finds any event, speaker or note across the week

**Status:** draft, awaiting your review · **Created:** 2026-11-04

Today you can search and filter only one day at a time, on that day's Schedule
page. To find "the AI panel with the Google speaker" you have to guess the day
first, and there's no way to ask for "free things tonight" or "workshops on
Thursday morning". With 431 events across seven days, finding things is the
planner's most common job. This plan adds a search page that covers the whole
week, plus filters that work the same way there and on each day's schedule.

## Search lives on its own page, one tap from anywhere

A search icon sits in the top corner of every page and opens `/search/`. The
page shows a search box with the keyboard up, a row of filter chips, and
results grouped by day:

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
holds the search (`/search/?q=ai&day=thu`), so back and forward work and a
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
"entre" finds "entrepreneurship". Results rank title matches first, then
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
the two pages behave the same. Its search box also gets a "Search the whole
week" link that carries your words over.

## It runs in the browser, so it's fast and works offline

The build writes one compact search file, `/search-index.json`, with what
search needs about each event and speaker: about 250 KB, or about 80 KB as
sent. The service worker saves it, so search works with no signal.
Searching runs in the browser as you type, with no server and no sign-in.
Notes are searched from the device and never sent anywhere.

The matching is our own small code rather than a library: about 100 lines
for case and accent folding, word starts and ranking. A library such as
MiniSearch would add typo tolerance ("enterpreneur") for about 7 KB; question 3
asks whether that's worth it.

## Four todos

| # | Task |
|---|------|
| 036 | `/search-index.json` and the matching code, with tests |
| 037 | `/search/`: the box, results by day, recent searches, the header icon |
| 038 | The filter chips and sheet, shared with each day's Schedule page |
| 039 | Speakers and your notes in the results; offline |

Each todo ships on its own; 036 and 037 together give a working week-wide
search.

## Four decisions for you

1. **Where search opens:** a search icon in every page header (recommended),
   a fifth tab in the bottom bar, or only from the Schedule tab?
2. **What it finds:** events, speakers and your notes (recommended), or
   events only?
3. **Typos:** exact word starts (recommended, no new library), or
   typo-tolerant matching with MiniSearch (about 7 KB)?
4. **Filters:** keep the full list above, or trim it? "Where" needs a rough
   "walkable from the convention center" line, which I'd draw at 1.5 km.
