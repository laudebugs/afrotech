# 041 — Admin dashboard: access, database totals and the page

**Status:** done · **Plan:** [Plan 0011](../plans/0011-admin-dashboard.md) · **Depends on:** none

## Goal

Give the site's admin a private page with usage totals from the database.

## Done when

- [x] `GET /api/admin/metrics` answers only accounts whose email is in the `ADMIN_EMAILS` secret; anyone else gets 404
- [x] Sign-in keeps an email only when Google marks it verified
- [x] Totals for accounts, My plan, notes and photos, with per-day counts in Houston time
- [x] "Top" lists show only sessions shared by at least 3 accounts; no names, emails or note text
- [x] `/admin/`: headline numbers, a bar chart per day with a table view, ranked lists, Refresh
- [x] Not linked, `noindex`, and no requests for a signed-out visitor
- [x] The privacy page says the admin sees totals only

## Notes

- **Code:**
  - `worker/admin.ts` holds the admin check and the queries.
  - `src/lib/admin.ts` shapes the days for the charts, tested in `tests/admin.test.ts`.
  - `src/pages/admin/index.astro` is the page.
- **Active accounts:** the database keeps no visit log, so "active per day"
  counts each account on the day of its latest star or note. "Signed in,
  last 30 days" counts accounts with an unexpired session.
- **Per-day counts:** stars count by their latest change, and notes by the
  day they were started, both by the device's clock. The charts cover at
  least the last 7 days and at most 14.
- **Tested** with `wrangler dev` and a local D1:
  - Signed out, a plain account, and an account whose unverified email
    matched the admin all got 404.
  - The admin got totals with no email or note text in the answer.
  - Screenshots on phone, desktop and dark mode.
- **Review fixes:**
  - Event titles in the page escape `<`, so a scraped title can't run script.
  - The service worker never saves `/admin/`.
  - Chart labels say what the database can tell: each account and star
    counts on the day of its latest change.
  - Google's `email_verified` counts as a boolean or the string "true".
  - Tooltips and tables give dates as `Wed, Nov 4`. The axis keeps `Wed 4`
    so 14 days fit on a phone.
  - The worker types no longer carry the local `TEST_JWKS`.
