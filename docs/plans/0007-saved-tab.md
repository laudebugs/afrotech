# Plan 0007: A "Saved" tab holds your plan and your notes

**Status:** approved 2026-11-03: named **Saved**, with the account panel on both tabs · **Created:** 2026-11-03

Your notes have no place in the tab bar. Today you reach My notes only from a
link in the page footer or from a session, while My plan has its own tab.
This plan renames the My plan tab to **Saved** and gives it two tabs, Plan
and Notes, so everything you've saved sits in one place. The same tab style also
replaces the map's Convention center / City buttons.

## The fourth tab becomes "Saved"

The tab bar keeps four sections: Now, Schedule, Map and **Saved**. Saved
keeps the star icon, since you star events to save them, and the badge with
your plan's event count stays. Both `/plan/` and `/notes/` light up the Saved
tab.

## Saved has two tabs: Plan and Notes

The top of both pages shows the heading **Saved** and two tabs:

```
Saved
 Plan · 3    Notes · 2
 ━━━━━━━━
```

- **Plan** is today's My plan page at `/plan/`: starred events, clashes,
  calendar export and the share link.
- **Notes** is today's My notes page at `/notes/`: your notes, newest first,
  and "Write a note".
- **Account:** sign-in, Sign out and Delete my data move below both tabs'
  content, as a small panel shared by both pages.

Each tab is a link to its own page, so links, back and forward work as
today, and both pages keep working offline. The counts come from the device.

## Tabs replace the map's buttons

The map's Convention center / City switch is a pair of filled buttons today.
It becomes the same tabs as Saved: plain text, with the current one in the accent
colour and underlined, over a thin line across the page. One component,
`PageTabs.astro`, draws both, so the two look the same.

## Two todos

| # | Task |
|---|------|
| 030 | `PageTabs` component; the map switch uses it |
| 031 | The Saved tab: rename, Plan and Notes tabs, shared account panel |

## Decided

On November 3 you chose the name **Saved** and the account panel on both
tabs.
