# 021 — "Ask for a change" and how profiles are made

**Status:** done · **Plan:** [Plan 0003](../plans/0003-speaker-profiles.md) · **Depends on:** 018

## Goal

Let speakers correct or remove their profile, and explain how profiles are built.

## Done when

- [x] "Is this you? Ask for a change" link on every profile, opening a prefilled GitHub issue form
- [x] `.github/ISSUE_TEMPLATE/speaker-change.yml` (installed by you if workflow permissions block it)
- [x] `/speakers/about/`: sources, the community-compiled label, removal within 48 hours
- [x] Removals go into the suppression list so rebuilds keep them out

Built on November 3:

- **Profiles:** every profile ends with "Is this you? Ask for a change or
  removal", opening `.github/ISSUE_TEMPLATE/speaker-change.yml` with the
  profile's name and address filled in, plus a link to `/speakers/about/`.
- **Form:** it asks for the profile, the request (correct something, remove a
  fact or link, remove the whole profile), details, and who's asking. Removals
  need no reason.
- **`/speakers/about/`:** where each part of a profile comes from, the
  Community-compiled rules, and the 48-hour promise.
- **Handling a request:**
  1. To remove a whole profile, add `{"id", "name", "date"}` to
     `data/sources/speaker-suppressions.json`; the build drops the profile and
     unlinks the name on events.
  2. To remove one fact, set its row to `"status": "rejected"` in
     `data/sources/speaker-research.json`.
  3. To correct official data (bio, title, photo), reply that it comes from
     AfroTech's schedule, and suppress or wait for AfroTech to fix it.
  4. Close the issue once the change is deployed.
