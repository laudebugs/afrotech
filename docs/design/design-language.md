# Design language: a plum timeline that reads at a glance on a phone

People will use this site standing in a hallway, phone in one hand, between
sessions. They need an answer in a glance, often on weak Wi-Fi. So the design
hangs every screen on a timeline, uses one plum accent and two IBM Plex
typefaces, and keeps touch targets generous. You chose this direction on November 3
from the options on the [design canvas](https://claude.ai/artifact/D2nw7f2nWWTyJEEzYwxKDz):
layout A1 (Timeline) in the Plum palette, with Plum Night as its dark mode.

## Five principles guide every screen

1. **Glanceable.** "What's on now, and where?" takes under 3 seconds to answer.
2. **Organised by time.** Lists group by start time, and "Now" sits one tap away.
3. **Colour with meaning.** Colour marks selected, live or clashing events, and
   nothing decorative.
4. **Content over chrome.** Borders and space separate things; shadows, cards
   and gradients stay out.
5. **Light on the network.** Four small self-hosted font files, no images in
   lists, and every page cached after the first visit.

## Nine colour tokens cover Plum and Plum Night

The tokens live in `src/styles/tokens.css` as CSS custom properties. Every text
colour passes WCAG AA (a contrast ratio of at least 4.5:1) on both `--bg` and
`--surface`; the lowest pair, green on the light page, still reaches 4.96:1.

| Token | Plum (light) | Plum Night (dark) | Use |
|-------|--------------|-------------------|-----|
| `--bg` | `#FAF6F7` | `#161015` | Page background: blush white or plum black |
| `--surface` | `#FFFFFF` | `#201820` | Cards, sheets, the tab bar and map panels |
| `--ink` | `#23161D` | `#F4ECEF` | Main text (16:1) |
| `--muted` | `#66545D` | `#B3A2AB` | Secondary text such as time, room and host (6.5:1) |
| `--line` | `#ECDFE4` | `#352A32` | Dividers, outlines and the timeline rail |
| `--accent` | `#7A2E5C` | `#E59AC4` | Plum for "in my plan", selected items and main buttons (8.3:1) |
| `--on-accent` | `#FFFFFF` | `#161015` | Text on an `--accent` fill (8.7:1) |
| `--live` | `#2B7A3B` | `#6CCB7F` | The "now" marker, live dots and progress bars (5.0:1) |
| `--warn` | `#8A5A00` | `#E8B04A` | Clash warnings in my plan (5.5:1) |

Green for live and amber for clashes differ from plum in lightness as well as
hue, so the three stay distinct for colour-blind readers too.

The map adds five pale area fills, at about 12% strength so labels stay
readable: `--area-stage`, `--area-room`, `--area-expo`, `--area-lounge` and
`--area-outside`. States sit on top of those fills. A live room gets a `--live`
outline, a room in my plan gets an `--accent` outline, and the selected room
gets a solid 2 px `--accent` stroke.

The theme follows the device setting (`prefers-color-scheme`), and a toggle
lets each device override it.

## IBM Plex Sans carries the text, and Plex Mono carries the times

You chose IBM Plex on November 3. Sans reads cleanly at small sizes, and Mono
gives every time and short label the same width, so the timeline's columns
line up.

- **Plex Sans** (`--font-sans`) for all text: weights 400 and 600.
- **Plex Mono** (`--font-mono`) for times and short labels: rail times, hour
  headers, the now marker, an event's date-and-time line, the day picker and
  "Day 3 of 5". Weights 500 and 600; the `.mono` class applies it anywhere.
- **Loading:** the fonts come from the `@fontsource` packages, Latin subset only
  (about 75 KB in four `woff2` files), served from our own domain with
  `font-display: swap`. The system UI stack shows while they load and for any
  character outside the Latin subset.
- **Times:** `font-variant-numeric: tabular-nums` on everything else, so numbers
  in Sans line up too.
- **Sizes** (rem, on a 16 px base): 0.75, 0.875, 1, 1.25, 1.5 and 2.
- **Titles:** two lines at most in lists, and in full on the detail page.

## Spacing, shape and motion stay small and consistent

- **Spacing:** steps of 4 px: 4, 8, 12, 16, 24, 32 and 48.
- **Corners:** 6 px on chips and buttons, 8 px on event cards and sheets, square on map shapes.
- **Touch targets:** at least 44 × 44 px, the "add to my plan" star especially.
- **Elevation:** flat, apart from one soft shadow under the bottom sheet.
- **Motion:** 150 ms ease-out for sheets and toggles. The live pulse is the
  only repeating animation, and all motion stops under `prefers-reduced-motion`.

## The Now screen hangs every event on a timeline

The Now screen, and every day view, follows layout A1 from the canvas:

1. **Header:** the date in large type ("Wed, Nov 4"), "Day 3 of 5" beside it,
   and three filter buttons below: **Everything**, **My plan · 3** and **Side
   events**. The active filter is filled with `--accent`.
2. **Timeline rail:** a 2 px `--line` rail runs down the left, with start times
   in a 48 px column beside it. Each event hangs off the rail on a dot: plum
   for events in my plan, `--muted` for the rest.
3. **Now marker:** a `--live` dot, rule and time label ("11:00") cross the rail
   at the current minute and move as time passes.
4. **Event cards:** `--surface` cards with a 1 px border and 8 px corners;
   events in my plan get a plum border. Each card shows the title, then the
   room and end time ("Grand Ballroom C · until 11:45").
5. **Progress bar:** live events add a 4 px bar showing how much of the session
   has passed, filled with `--live`.
6. **Clash warning:** cards in my plan that overlap another pick add one
   `--warn` line, such as "In my plan · clashes with 11:05".

Past events collapse above the now marker, and later events continue below it.

## Layout starts on the phone and widens in two steps

On a phone, the site shows one column with 16 px side margins. A tab bar along
the bottom holds **Now**, **Schedule**, **Map** and **My plan**, and event
details slide up as a bottom sheet. From 768 px wide, the column grows to a
maximum of 720 px. From 1024 px, a navigation rail moves to the left, the list
sits in the middle and a map panel on the right follows the selected event. At
every width, including 320 px, the page avoids horizontal scrolling.

## Eleven components make up the interface

| Component | Behaviour |
|-----------|-----------|
| **Chip** | A filter such as day, track, official or side, or free. Outlined when off, filled with `--accent` when on. |
| **Timeline rail** | The 2 px vertical line, time column and dots that every day view hangs on. |
| **Progress bar** | A 4 px `--live` bar on live event cards showing how far the session has run. |
| **Star** | Outlined when off, filled with `--accent` when on. Screen readers hear "Added to my plan". |
| **Now marker** | A `--live` dot, rule and time label crossing the timeline rail at the current minute. |
| **Time header** | A sticky hour header ("9 AM") on long day views, so you keep your place while scrolling past dozens of events. |
| **Clash badge** | `--warn` text, "Clashes with …", on overlapping events in My plan. |
| **You are here** | An `--accent` dot inside a translucent accuracy circle. |
| **Event card** | Hangs off the timeline rail: title (600 weight), room and end time, plus a star. Plum border when in my plan. Tapping the card opens details; tapping the star adds the event without opening it. |
| **Map area** | Tapping a room opens a sheet listing its sessions today. The [SVG research](../research/svg-floor-plan.md) covers the details. |
| **Bottom sheet** | Event details: time, place with "Show on map", speakers, description, RSVP link, "Add to calendar" and my notes. |

## Short, plain words and Houston time everywhere

Labels stay short: "Now", "Up next", "Add", "Clashes with…" and "Near me".
Times read `2:30 PM` and dates read `Wed, Nov 4`, always in Houston time.
