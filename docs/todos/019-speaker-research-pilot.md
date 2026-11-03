# 019 — Speaker research format and a 20-speaker pilot

**Status:** done · **Plan:** [Plan 0003](../plans/0003-speaker-profiles.md) · **Depends on:** 018

## Goal

Set up the research format and checks, then research 20 speakers to learn what each profile gains.

## Done when

- [x] `data/sources/speaker-research.json`: per speaker, facts and articles as `{text, url, publisher, date, tier, identity_quote, claim_quote, status}`
- [x] `scripts/check_research.py`: fetches each URL, confirms both quotes appear, rejects blocklisted domains
- [x] Only `approved` rows render, labelled "Community-compiled" with a source on every line
- [x] Pilot: 20 speakers, chosen from your plan and Main Stage, with an identity score each
- [x] A review table in the PR: approve or strike each row

## Notes

Follows the [research report](../../reports/Speaker%20profile%20research%20sources.md): two identifiers before any fact, verbatim quotes, a blocklist of people-search sites, and a "not this person" log. Fun facts publish only after review; until you say otherwise, you review each batch.

Built on November 3:

- **Pilot results:** 20 speakers, 17 with something to review: 33 facts, 41
  articles or talks and 1 website, all drafts. Findings and the review table
  are in [`docs/research/speaker-research-pilot.md`](../research/speaker-research-pilot.md).
- **Tools:** `scripts/merge_research.py` merges a batch as drafts (rejecting
  non-https or blocklisted sources) and prints the review table.
  `scripts/check_research.py` fetches each source and confirms both quotes.
- **Unverified quotes:** the source pages were blocked here, so every quote
  came from search results and must be checked before approval.
- **Waiting on you:** approving rows. Nothing appears on the site until a row is
  `approved`. Todo 020 (the remaining speakers) should wait until you've
  reviewed this batch and decided it's worth it.
