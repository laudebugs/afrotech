# Plan 0011: An admin dashboard shows how people use the site, without tracking visitors

**Status:** built 2026-11-04 (todos 041–042): database totals and Cloudflare traffic; admin is your Google email · **Created:** 2026-11-04

You can't see today how many people use the planner, what they save or which
sessions they take notes on. The data partly exists already: every signed-in
account, star, note and photo sits in the D1 database. Page views are
missing, because the site promises that signed-out visitors send no requests
and static pages never reach the Worker. This plan adds a private `/admin/`
page that only you can open. It shows account and usage numbers from the
database, and page traffic from Cloudflare's own logs if you want it. Neither
source adds any tracking to the site.

## Only you can open the dashboard

The dashboard lives at `/admin/`. The tab bar doesn't link to it, search
engines are told to skip it, and the offline service worker leaves it out.
The page holds no numbers itself. It asks the Worker for them, and the Worker
answers only your account:

1. You sign in with Google as usual, on the Saved tab.
2. The Worker compares the account's email with `ADMIN_EMAILS`, a variable in
   `wrangler.jsonc`. On November 4 you chose to keep it there, in the
   repository, rather than as a Cloudflare secret.
3. Anyone else, signed in or not, gets "Not found". A signed-out visitor's
   page sends no request at all.

Sign-in will also start saving an email only when Google marks it as
verified, so nobody can claim your address with another account.

## The database answers who signed in and what they saved

One route, `GET /api/admin/metrics`, counts from the tables the site already
has. Each count covers the whole week (November 1–7) and each day in Houston
time:

| Section | Shows |
|---------|-------|
| Accounts | Total accounts, new accounts per day, sign-ins per day, accounts signed in now |
| My plan | Accounts with stars, total stars, stars per day, the 10 most-starred sessions |
| Notes | Accounts with notes, live notes, notes written per day, the sessions with the most notes |
| Photos | Photos stored and the space they take |

Every number is a total. The dashboard never shows
names, emails or the text of a note, and it never reads note text at all.
The two "top sessions" lists include only sessions saved by at least three
accounts, so a list can't point at one person.

## Cloudflare's logs can add page views, if you want them

Cloudflare already counts every request to the site, so page views need no
change for visitors. A second route, `GET /api/admin/traffic`, would read
Cloudflare's GraphQL Analytics API for `afrotech26.laudebugs.me`:

| Shows | Detail |
|-------|--------|
| Page views and visitors | Per day; visitors are Cloudflare's estimate of unique devices |
| Top pages | The 10 most viewed paths, such as `/map/` or one event |
| Countries and devices | Where views come from, and phone or desktop |

This part needs one thing from you: a Cloudflare API token that can only read
analytics for the `laudebugs.me` zone, saved as the secret `CF_ANALYTICS_TOKEN`.
I'll give the exact steps. Cloudflare's free plan keeps these logs for a
limited time, so this section shows the recent days rather than all time.

A page-view counter of our own would be a third source, and I advise against
it: every visitor would send a request, which breaks the site's promise about
signed-out visitors.

## The page is small and built like the rest of the site

`/admin/` is a plain Astro page with a short script, like the other pages.
It shows each section as a few large numbers and a bar chart per day, drawn
as SVG with the design tokens, so it needs no chart library. A "Refresh"
button fetches the numbers again; nothing refreshes on its own. Dates and
times use Houston time, as everywhere else.

## Two todos

| # | Task |
|---|------|
| 041 | Admin access, `/api/admin/metrics` from the database, and the `/admin/` page |
| 042 | Page traffic from Cloudflare's analytics on the same page (only if you choose it) |

Todo 041 is useful on its own, and it needs no setup in Cloudflare.

## Decided

On November 4 you chose both sources, the database and Cloudflare's traffic,
with your own Google email as the admin, kept in `wrangler.jsonc`. Traffic
works once you add the secret `CF_ANALYTICS_TOKEN` in Cloudflare.
