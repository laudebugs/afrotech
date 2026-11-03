# Design language

Minimal, warm, and built for a phone held in one hand in a crowded hall.

## Principles

1. **Glanceable.** "What's on now, and where?" answered in under 3 seconds.
2. **Time is the spine.** Lists are grouped by start time; "now" is always one tap away.
3. **One accent.** Color means something (selected, live, conflict) — never decoration.
4. **Content over chrome.** Borders and space instead of shadows, cards and gradients.
5. **Works on bad Wi-Fi.** System fonts, no images in lists, everything cached after the first visit.

## Color

Tokens live in `src/styles/tokens.css` as CSS custom properties. Every
text color below meets WCAG AA (≥ 4.5:1) on both `--bg` and `--surface`.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` | `#FAF8F5` | `#15130F` | Page background (warm paper / warm black) |
| `--surface` | `#FFFFFF` | `#1E1B17` | Sheets, sticky headers, map panels |
| `--ink` | `#1C1915` | `#F2EEE8` | Primary text (16.5:1) |
| `--muted` | `#5F584F` | `#A79F94` | Secondary text: time, room, host (6.6:1) |
| `--line` | `#E7E2DA` | `#2E2A24` | Dividers, outlines |
| `--accent` | `#B5452B` | `#F08A6C` | Terracotta. Selected, "in my plan", primary buttons (5.1:1) |
| `--live` | `#2B7A3B` | `#6CCB7F` | Happening now (5.0:1) |
| `--warn` | `#8A5A00` | `#E8B04A` | Clashes in my plan (5.6:1) |

Text on an `--accent` fill: `#FFFFFF` in light mode, `--bg` in dark mode.

**Map area fills** (muted, ~12% tints so labels stay readable):
stages · meeting rooms · expo floor · lounges · outside. Defined as
`--area-stage`, `--area-room`, `--area-expo`, `--area-lounge`, `--area-outside`.
State is layered on top: `.live` → `--live` outline, `.in-my-plan` → `--accent`
outline, `.selected` → solid `--accent` 2 px stroke.

Dark mode follows the system (`prefers-color-scheme`), with a manual toggle
stored per device.

## Type

- **Family:** system UI stack — `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web fonts.
- **Times:** `font-variant-numeric: tabular-nums` so columns of times line up.
- **Scale** (rem, 16 px base): 0.75 · 0.875 · 1 · 1.25 · 1.5 · 2.
- **Weights:** 400 body, 600 titles and times. Nothing else.
- Event titles wrap to 2 lines max on lists, full on the detail sheet.

## Space, shape, motion

- **Spacing:** 4 px base — 4, 8, 12, 16, 24, 32, 48.
- **Radius:** 8 px (chips, inputs), 12 px (sheets). Map shapes square.
- **Touch targets:** at least 44 × 44 px (the "add to my plan" star especially).
- **Elevation:** none, except the bottom sheet (one soft shadow).
- **Motion:** 150 ms ease-out for sheets and toggles. The "live" pulse is the only
  looping animation; all motion off under `prefers-reduced-motion`.

## Layout

- **Mobile (default):** single column, 16 px gutters. Bottom tab bar with
  **Now · Schedule · Map · My plan**. Detail opens as a bottom sheet.
- **Tablet ≥ 768 px:** same, with wider content (max 720 px).
- **Desktop ≥ 1024 px:** left nav rail, list in the middle, map panel on the
  right that follows the selected event.
- No horizontal scroll at 320 px.

## Components

| Component | Notes |
|-----------|-------|
| **Event row** | Time (tabular, muted) · title (600) · room · track chip · star. Whole row opens the detail sheet; star toggles "my plan" without opening. |
| **Time header** | Sticky "9:00 AM" group header. Current group gets a `--live` "Now" marker. |
| **Now line** | Thin `--live` rule across time-based views at the current minute. |
| **Chip** | Filters (day, track, official/side, free). Outline by default, `--accent` fill when on. |
| **Star** | Outline when off, `--accent` filled when on. Announces "Added to my plan". |
| **Clash badge** | `--warn` text "Clashes with …" on rows in My plan that overlap. |
| **Bottom sheet** | Event detail: time, place ("Show on map"), speakers, description, RSVP link, add to calendar, my notes. |
| **Map area** | See [SVG research](../research/svg-floor-plan.md). Tap → sheet listing that room's sessions today. |
| **You-are-here** | `--accent` dot with a translucent accuracy circle. |

## Voice

Short, plain labels: "Now", "Up next", "Add", "Clashes with…", "Near me".
Times always as `2:30 PM`, dates as `Wed, Nov 4`. Houston time, always.
