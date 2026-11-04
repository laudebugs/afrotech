# 042 — Page traffic from Cloudflare's analytics

**Status:** done · **Plan:** [Plan 0011](../plans/0011-admin-dashboard.md) · **Depends on:** 041

## Goal

Show page views on the admin dashboard without adding any tracking to the site.

## Done when

- [x] `GET /api/admin/traffic` reads Cloudflare's GraphQL Analytics API with the `CF_ANALYTICS_TOKEN` secret
- [x] Page views and visits per day for the last 7 Houston days; top pages, countries and devices
- [x] Without a token the page says how to set it up; a Cloudflare error shows its message to the admin

## Notes

- **What counts:** the query keeps HTML responses for
  `afrotech26.laudebugs.me` (`ANALYTICS_HOST`) that people requested
  (`requestSource: eyeball`). Scripts, images, data files and the Worker's
  own fetches stay out.
- **Day by day:** each day is its own query, because the free plan limits
  how long a range one query may cover. A day past Cloudflare's retention
  fails alone, and the page says how many days are missing.
- **Zone:** the Worker looks up the zone id of `ANALYTICS_ZONE`
  (`laudebugs.me`) with the same token, so the token needs Zone Read as well
  as Analytics Read.
- **Not tested against Cloudflare:** no token was available here. The page
  was tested with sample traffic, and the Worker with no token.
- **Review fixes:** every day in the range gets a bar, so a day that failed
  shows as a gap. "Today's views" reads today, not the last day that loaded.
- **Requests:** each load or Refresh makes up to 8 Cloudflare API calls (the
  zone lookup, once per Worker instance, and 7 days). Cloudflare's GraphQL
  limit is far above what one admin's Refresh button can reach.
