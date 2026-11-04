# Plan 0010: A Liquid Glass tab bar and app-like page transitions

**Status:** built 2026-11-04 at your request (todo 040) · **Created:** 2026-11-04

On a phone, the planner should move like an iPhone app with iOS 26's
Liquid Glass look, not like a website. Two things make the difference: a
floating glass tab bar whose highlight glides between tabs, and pages that
fade between tabs and slide when you go deeper or back.

## The tab bar floats, as glass

The bottom bar becomes a pill that floats 10 px above the screen's bottom and
sides.

- **Glass:** the page shows through it, blurred and slightly brighter
  (`backdrop-filter: blur(20px) saturate(180%)`), under a bright top edge and
  a soft shadow.
- **Capsule:** a tinted capsule sits behind the current tab, as in iOS 26.
- **Press:** pressing a tab squeezes its icon and swells the capsule; letting
  go springs back.
- **Fallbacks:** "Reduce transparency" or a browser without backdrop blur
  gets a solid bar. High-contrast mode gets outlines.
- **Desktop:** from 1024 px it stays a left rail, with the same capsule.

## Pages move like an app's

Cross-document view transitions animate between whole pages without a
single-page app. They work in Safari 18.2+ and Chrome 126+; other browsers
switch pages instantly, as today. A small script in each page's head names
each change:

| Change | Example | Motion |
|--------|---------|--------|
| tab | Schedule → Map | A quick crossfade; the bar stays still and its capsule glides to the new tab in one smooth motion |
| push | Schedule → an event | The new page slides in from the right over the old one, which drifts left and dims |
| pop | Back to the schedule | The reverse |

A tap on the tab bar, or any move to a tab page, is a tab change. Any other
move forward pushes. Back pops: the browser reports it where it can
(Chrome), and elsewhere a short history kept for the session recognises it.
During the week, links to `/schedule/` go straight to today's page, since the
redirect there would cancel the transition. With "Reduce motion" on,
pages switch instantly.

## The tab bar steps aside while you type

On a phone (a touch screen narrower than 1024 px, where the bottom tab bar
shows), the bar slides down out of the way while you type in a
text field or the note editor, leaving room for the keyboard and the
editor's toolbar, and comes back when you finish (`src/scripts/typing.ts`).
It counts as typing once you tap into a field or the keyboard is up. A field
focused by the page itself, such as search's box, leaves the bar alone
until then.

## Not included

iOS 26 bars can also shrink while you scroll. That's an option apps opt
into, not the default, so it's left out. Web pages can't use the iPhone's
haptics.
