# 019 — Speaker research format and a 20-speaker pilot

**Status:** todo · **Plan:** [Plan 0003](../plans/0003-speaker-profiles.md) · **Depends on:** 018

## Goal

Set up the research format and checks, then research 20 speakers to learn what each profile gains.

## Done when

- [ ] `data/sources/speaker-research.json`: per speaker, facts and articles as `{text, url, publisher, date, tier, identity_quote, claim_quote, status}`
- [ ] `scripts/check_research.py`: fetches each URL, confirms both quotes appear, rejects blocklisted domains
- [ ] Only `approved` rows render, labelled "Community-compiled" with a source on every line
- [ ] Pilot: 20 speakers, chosen from your plan and Main Stage, with an identity score each
- [ ] A review table in the PR: approve or strike each row

## Notes

Follows the [research report](../../reports/Speaker%20profile%20research%20sources.md): two identifiers before any fact, verbatim quotes, a blocklist of people-search sites, and a "not this person" log. Fun facts publish only after review; until you say otherwise, you review each batch.
