# Design language: warm, quiet and readable on a phone in a crowded hall

People will use this site standing in a hallway, phone in one hand, between
sessions. They need an answer in a glance, often on weak Wi-Fi. So the design
uses one accent colour, system fonts, generous touch targets and time as the
main way to organise everything.

## Five principles guide every screen

1. **Glanceable.** "What's on now, and where?" takes under 3 seconds to answer.
2. **Organised by time.** Lists group by start time, and "Now" sits one tap away.
3. **Colour with meaning.** Colour marks selected, live or clashing events, and
   nothing decorative.
4. **Content over chrome.** Borders and space separate things; shadows, cards
   and gradients stay out.
5. **Light on the network.** System fonts, no images in lists, and every page
   cached after the first visit.

## Eight colour tokens cover both themes

The tokens live in `src/styles/tokens.css` as CSS custom properties. Every text
colour passes WCAG AA (a contrast ratio of at least 4.5:1) on both `--bg` and
`--surface`.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` | `#FAF8F5` | `#15130F` | Page background: warm paper or warm black |
| `--surface` | `#FFFFFF` | `#1E1B17` | Sheets, sticky headers and map panels |
| `--ink` | `#1C1915` | `#F2EEE8` | Main text (16.5:1) |
| `--muted` | `#5F584F` | `#A79F94` | Secondary text such as time, room and host (6.6:1) |
| `--line` | `#E7E2DA` | `#2E2A24` | Dividers and outlines |
| `--accent` | `#B5452B` | `#F08A6C` | Terracotta for selected items, "in my plan" and main buttons (5.1:1) |
| `--live` | `#2B7A3B` | `#6CCB7F` | Events happening now (5.0:1) |
| `--warn` | `#8A5A00` | `#E8B04A` | Clashes in my plan (5.6:1) |

Text on an `--accent` fill uses white in light mode and `--bg` in dark mode.

The map adds five pale area fills, at about 12% strength so labels stay
readable: `--area-stage`, `--area-room`, `--area-expo`, `--area-lounge` and
`--area-outside`. States sit on top of those fills. A live room gets a `--live`
outline, a room in my plan gets an `--accent` outline, and the selected room
gets a solid 2 px `--accent` stroke.

The theme follows the device setting (`prefers-color-scheme`), and a toggle
lets each device override it.

## System fonts and tabular times keep text fast and aligned

- **Family:** the system UI stack, `system-ui, -apple-system, "Segoe UI",
  Roboto, sans-serif`, so no font files download.
- **Times:** `font-variant-numeric: tabular-nums`, so columns of times line up.
- **Sizes** (rem, on a 16 px base): 0.75, 0.875, 1, 1.25, 1.5 and 2.
- **Weights:** 400 for body text and 600 for titles and times.
- **Titles:** two lines at most in lists, and in full on the detail page.

## Spacing, shape and motion stay small and consistent

- **Spacing:** steps of 4 px: 4, 8, 12, 16, 24, 32 and 48.
- **Corners:** 8 px on chips and inputs, 12 px on sheets, square on map shapes.
- **Touch targets:** at least 44 × 44 px, the "add to my plan" star especially.
- **Elevation:** flat, apart from one soft shadow under the bottom sheet.
- **Motion:** 150 ms ease-out for sheets and toggles. The live pulse is the
  only repeating animation, and all motion stops under `prefers-reduced-motion`.

## Layout starts on the phone and widens in two steps

On a phone, the site shows one column with 16 px side margins. A tab bar along
the bottom holds **Now**, **Schedule**, **Map** and **My plan**, and event
details slide up as a bottom sheet. From 768 px wide, the column grows to a
maximum of 720 px. From 1024 px, a navigation rail moves to the left, the list
sits in the middle and a map panel on the right follows the selected event. At
every width, including 320 px, the page avoids horizontal scrolling.

## Nine components make up the interface

| Component | Behaviour |
|-----------|-----------|
| **Chip** | A filter such as day, track, official or side, or free. Outlined when off, filled with `--accent` when on. |
| **Star** | Outlined when off, filled with `--accent` when on. Screen readers hear "Added to my plan". |
| **Now line** | A thin `--live` rule across time-based views at the current minute. |
| **Time header** | A sticky "9:00 AM" group header. The current group carries a `--live` "Now" marker. |
| **Clash badge** | `--warn` text, "Clashes with …", on overlapping events in My plan. |
| **You are here** | An `--accent` dot inside a translucent accuracy circle. |
| **Event row** | Time (muted, tabular), title (600 weight), room, track chip and star. Tapping the row opens details; tapping the star adds the event without opening it. |
| **Map area** | Tapping a room opens a sheet listing its sessions today. The [SVG research](../research/svg-floor-plan.md) covers the details. |
| **Bottom sheet** | Event details: time, place with "Show on map", speakers, description, RSVP link, "Add to calendar" and my notes. |

## Short, plain words and Houston time everywhere

Labels stay short: "Now", "Up next", "Add", "Clashes with…" and "Near me".
Times read `2:30 PM` and dates read `Wed, Nov 4`, always in Houston time.
