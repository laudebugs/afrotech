# Disambiguating people when researching speaker profiles

Scope: how to confirm that a web source is about *this* AfroTech 2026 speaker (known inputs: full name, title, company, bio, headshot URL, often LinkedIn), and how to avoid attributing facts or articles to a same-named person. Research done 2026-11-03.

**Method note:** In this session WebFetch was blocked for cjr.org, nature.com and en.wikipedia.org, so findings come from search-result summaries rather than the primary pages. Most claims below cite the primary page's URL. Where a figure only appeared in secondary coverage, it's marked "secondary" and should be checked before anyone quotes it.

## What signals reliably confirm a match?

### Takeaway
A name alone is never a key. Confirm identity with signals that tie a source to the *known* profile: the person's own LinkedIn or site links to the source (or the source links back), the employer and title appear together in the same source, distinctive bio phrases match, or a persistent ID (ORCID, Wikidata QID, LinkedIn ID) is shared. The AfroTech/conference link and a headshot comparison are supporting signals, not proof.

### Cited Findings
- Names are not unique keys. Thousands of active researchers can share the same given name and family name, and name strings cut to initials lose the information disambiguation needs most — [CASRAI: ORCID search by name, the common-name problem](https://casrai.org/wp/?p=3238); [CASRAI: author name disambiguation](https://casrai.org/guides/author-name-disambiguation-orcid-algorithmic-matching-cris)
- ORCID's own guidance discourages organizations from attaching ORCID iDs based only on a name search. An iD is valuable because it's tied to the person, not to the name string, and researchers can list their aliases under it — [CASRAI](https://casrai.org/guides/author-name-disambiguation-orcid-algorithmic-matching-cris); [Cornell library guide](https://guides.library.cornell.edu/impact/author-disambiguation)
- ORCID coverage is incomplete. Not every author has an iD, and integrations that attach iDs by name-string match misattribute records — [CASRAI](https://casrai.org/wp/?p=3238)
- Wikidata items act as identifier hubs: one item links out to external IDs such as VIAF and ORCID. Mix'n'Match crowdsources matching external IDs to items — [Bodleian: reconciling identifiers with Wikidata](https://blogs.bodleian.ox.ac.uk/digital/2017/10/12/reconciling-database-identifiers-with-wikidata/); [Te Papa: roundtripping people identifiers with Wikidata](https://blog.tepapa.govt.nz/?p=88258)
- Wikidata has a property for LinkedIn personal profile IDs, P6634 (example `linkedin:deborahlehr`), so a Wikidata item that carries the speaker's LinkedIn ID is a strong cross-link — [Bioregistry: LinkedIn](https://bioregistry.io/linkedin)
- Reciprocal links are the web's standard proof of identity. Under IndieWeb `rel="me"` (used by Mastodon verification), a profile counts as verified when the site links to the profile and the profile links back. It proves the same person controls both pages, not who that person is in real life — [Eric Meyer](https://meyerweb.com/eric/thoughts/2022/11/30/how-to-verify-site-ownership-on-mastodon-profiles/); [UniLink](https://www.unilink.us/blog/mastodon-verified-link); [fedi.tips](https://fedi.tips/?p=976)
- Lateral reading (Caulfield's SIFT: Stop, Investigate the source, Find better coverage, Trace claims) means checking a claim against other sources instead of trusting the page it's on — [UC Merced SIFT guide](https://libguides.ucmerced.edu/news/evaluation/sift-method); [Caulfield, Hapgood](https://hapgood.us/2019/05/12/sift-and-a-check-please-preview/)
- Facial-recognition search engines such as PimEyes draw strong privacy objections. Big Brother Watch complained to the UK ICO that the service is "deeply privacy-intrusive" and could be used to stalk people, and the NYT tested it only on consenting staff — [Big Brother Watch](https://bigbrotherwatch.org.uk/2022/11/pimeyes-a-facial-search-engine-could-be-used-by-stalkers/); [Pixel Envy on the NYT profile](https://pxlnv.com/linklog/pimeyes-profile/)

### Inferences
- Ranked signal strength for this project, strongest first:
  1. **Self-asserted links.** The speaker's own LinkedIn or personal site links to the article, talk or site, or the source links to their LinkedIn or site. This is the same logic as reciprocal `rel="me"`.
  2. **Shared persistent ID.** The source carries the same LinkedIn slug, ORCID iD or Wikidata QID, and that QID lists the same LinkedIn ID (P6634) or website.
  3. **Employer and title in the same source**, matching the AfroTech listing or a role in their LinkedIn history, with dates that fit.
  4. **Distinctive bio phrases or facts** (a named prior employer, a founded company, a book title) that also appear in the AfroTech bio.
  5. **Conference co-occurrence** (other AfroTech or Blavity pages, other conference speaker pages giving the same company).
  6. **Headshot looks the same** as the AfroTech headshot, compared by eye. Treat it as supporting only: photos are reused, cropped and dated, and a look-alike isn't proof.
- Don't use face-search engines (PimEyes and similar). Their privacy risk conflicts with the project's ethical-OSINT constraint. A plain visual check of the speaker's own published headshot against a candidate page is fine.
- A Wikidata QID only helps if it was itself confirmed by signals 1–4. Many speakers will have no Wikidata item at all.

### Gaps
- I couldn't fetch the Wikidata pages for P6634 or Help:Description, so the exact property constraints are unverified.
- I found no empirical study measuring how accurate headshot comparison is as a disambiguation signal for manual researchers.

## How do record-linkage and entity-resolution practices apply to a small manual set?

### Takeaway
Fellegi–Sunter offers a usable mental model: add up weighted evidence from each field (name, employer, title, location, bio facts), give more weight to agreement on rare values, and set two thresholds that create match, non-match and a "clerical review" zone. For 273 speakers, apply this as a checklist score, not a fitted model. Standardise names first and allow for known variants.

### Cited Findings
- Fellegi and Sunter (1969) formalised Newcombe's ideas (1959, 1962). They classify record pairs into matches (M) and non-matches (U) from field-agreement patterns, using ratios of match and non-match probabilities, and prove the decision rule optimal — [Winkler, Census RR99-04](https://www.census.gov/content/dam/Census/library/working-papers/1999/adrm/rr99-04.pdf); [Winkler 2013 FCSM](https://www.fcsm.gov/assets/files/docs/J1_Winkler_2013FCSM.pdf)
- Agreement on a rare value is worth more than agreement on a common one. A match on an uncommon surname is stronger evidence than a match on "Smith", because coincidental agreement is less likely — [Winkler, Census RR99-04](https://www.census.gov/content/dam/Census/library/working-papers/1999/adrm/rr99-04.pdf)
- Winkler extended the model with string comparators (Jaro, later Jaro–Winkler), so spelling variants earn partial credit — [Winkler 1990](https://www.stat.cmu.edu/NCRN/PUBLIC/RLClassFiles/HW/Winkler1990.pdf)
- Name and address standardisation before linking are "absolutely crucial" — [Winkler, Census RR99-04](https://www.census.gov/content/dam/Census/library/working-papers/1999/adrm/rr99-04.pdf)
- The model needs m and u probability estimates for each field, and poor estimates produce miscalibrated scores (vendor overview, less authoritative) — [MetricGate record linkage](https://metricgate.com/docs/record-linkage)
- Human-in-the-loop review is standard for uncertain pairs in entity-resolution pipelines — [arXiv 2111.10497](https://arxiv.org/pdf/2111.10497); [O'Reilly, Hands-On Entity Resolution ch. 1](https://www.oreilly.com/library/view/hands-on-entity-resolution/9781098148478/ch01.html)
- LLM-plus-graph methods reached about 96.7% F1 on a 606-case gold standard for author-name disambiguation (secondary summary of the paper) — [arXiv 2511.07168](https://arxiv.org/html/2511.07168v1)

### Inferences
- A manual Fellegi–Sunter-style tally per candidate source might look like this:
  - **+3** self-asserted link, or shared persistent ID
  - **+2** employer and title in the same source, consistent with LinkedIn dates
  - **+2** distinctive bio fact matches
  - **+1** each for matching city or region, industry or field, conference co-occurrence, or headshot resemblance
  - **−3** any hard contradiction: a different employer at the same date, a different field, a different career stage, a different location with no move, or a photo that is clearly someone else
  - **Name agreement scores 0.** It only makes the source a candidate. A rare name lowers the bar slightly, and a common name (for example, a common English first and last name) requires at least one +3 or two +2 signals.
- The "clerical review" zone maps onto a "medium" confidence rating (see the rubric below). Those items get a second look or are left out.
- With 273 speakers, a spreadsheet with one row per (speaker, claim, source) works better than any automated model.

### Gaps
- No source gave calibrated weights for manual web research. The point values above are my own heuristic, not taken from literature.

## How do knowledge bases (Wikidata/Wikipedia) and fact-checkers disambiguate people?

### Takeaway
Wikidata keeps same-named people apart through unique label-and-description pairs, external identifiers and references. It has no disambiguation pages, and it deprecates bad identifiers rather than deleting them. Wikipedia's BLP policy demands careful, high-quality sourcing for living people and presumes in favour of privacy for low-profile details. Journalism verification guides teach lateral reading and multi-source corroboration.

### Cited Findings
- On Wikidata, the description exists to tell apart items with the same or similar labels. No two items can share both label and description — [Wikidata SPARQL tutorial: adding description](https://wdqs-tutorial.toolforge.org/index.php/simple-queries/the-simplest-query/adding-description/)
- Wikidata has no disambiguation pages. For common names, editors advise adding as much information as possible to an item so it is clearly distinguished, and splitting conflated items into two — [Wikidata User talk:Arcadialib](https://www.wikidata.org/wiki/User_talk:Arcadialib)
- An editor reports switching from deleting wrong identifiers to *deprecating* them, because deleted IDs kept being re-added to the same item. This is a useful pattern for recording known non-matches — [Wikidata User talk:Arcadialib](https://www.wikidata.org/wiki/User_talk:Arcadialib)
- Schema.org's `disambiguatingDescription` is "a short description of the item used to disambiguate from other, similar items" — [schema.org](https://schema.org/disambiguatingDescription)
- Wikidata statements should be verifiable against referenceable sources. Wikipedia isn't an acceptable source, and statements backed only by "imported from Wikimedia project" (P143) don't count as sourced. Editors are asked to "err on the side of respecting privacy" for living people — [Wikidata Working Hour notes, Aug 2022](https://www.wikidata.org/wiki/Wikidata:WikiProject_LD4_Wikidata_Affinity_Group/Wikidata_Working_Hours/Wikidata_Working_Hour_Summer-Fall_Project_2022/2022-August-5_Wikidata_Working_Hour); [Wiki Education: adding sources to Wikidata](https://dashboard.wikiedu.org/training/professional-development/adding-to-wikidata/adding-sources-wikidata)
- Wikipedia's BLP policy has a "Presumption in favor of privacy" section. WP:BLPNAME says the presumption is strong for family members and other loosely involved, low-profile people — [Wikipedia:BLP](https://www.wikipedia.org/wiki/WP:BLP); quoted on [Talk:Herb Wesson](https://www.wikipedia.com/wiki/Talk:Herb_Wesson)
- Wikiquote requires every quote attributed to a living person to be verified by a reliable source — [Wikiquote:BLP](https://en.wikiquote.org/wiki/Wikiquote:BLP)
- Wikipedia has a guideline page on non-unique personal names — [Wikipedia:Non-unique personal name (mirror)](https://www.gwern.net/wiki/Wikipedia:Non-unique_personal_name)
- The Verification Handbook for Investigative Reporting (European Journalism Centre) has a people-research chapter. Bellingcat's Online Investigation Toolkit and its Beginner's Guide to Social Media Verification cover searching for people and basic verification — [Verification Handbook 2](https://datajournalism.com/read/handbook/verification-2); [Bellingcat beginner's guide](https://www.bellingcat.com/resources/2021/11/01/a-beginners-guide-to-social-media-verification/); [GIJN fact-checking resources](https://gijn.org/resource/fact-checking-verification/)

### Inferences
- Give each speaker record a one-line "disambiguating description" (title, company, city) and check every candidate source against it, as a Wikidata description does.
- Keep a "known not this person" list per speaker (URLs or the other person's employer), so later researchers or reruns don't re-add the same wrong match. This follows the deprecate-don't-delete pattern.
- Following BLP and Wikidata privacy norms: publish only professional facts tied to the speaker's public role, with no family, birthdates or home details. That matches the project rule to keep personal contact details off the site.
- Don't cite Wikipedia as a source for a fact. Use it only to find primary sources, as Wikidata does.

### Gaps
- I couldn't retrieve the Verification Handbook's people-research chapter text, the Bellingcat toolkit's people section, or the BLP noticeboard's handling of same-name conflation. They're cited only at the level of what they cover.

## LLM-assisted research: failure modes and mitigations

### Takeaway
LLM search tools often cite wrongly, invent URLs and blend same-named people into one biography, and they rarely say "I don't know". Require a verbatim quote for every claim, fetch each URL to confirm it resolves and contains that quote, apply a two-source rule (or one self-asserted source), and check how recent the role is.

### Cited Findings
- **Tow Center/CJR (March 2025):** 1,600 queries across 8 AI search tools gave incorrect answers more than 60% of the time. More than half of the citations from Gemini and Grok 3 led to fabricated or broken URLs. Premium tiers were no better and were sometimes more confidently wrong. All tools except Copilot were more likely to give a wrong answer than to admit a limitation — [CJR Tow Center](https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php); per-tool rates (Perplexity 37% wrong, Grok 3 94%) via secondary coverage — [Gigazine](https://gigazine.net/gsc_news/en/20250312-ai-search-engine-compared)
- **SourceCheckup (Wu, Wu, Zou et al., Nature Communications, 16 Apr 2025):** 50–90% of LLM responses weren't fully supported by the sources they cited. For GPT-4o with web search, about 30% of individual statements were unsupported, and nearly half of responses weren't fully supported. The automated checker agreed with a consensus of three physicians about 88% of the time — [PMC12003634](https://pmc.ncbi.nlm.nih.gov/articles/PMC12003634/); [Stanford Law summary](https://law.stanford.edu/publications/an-automated-framework-for-assessing-how-well-llms-cite-relevant-medical-references/); [arXiv 2402.02008](https://arxiv.org/pdf/2402.02008)
- **Same-name conflation, measured directly:** the AmbigBio set (500 names from Wikipedia disambiguation pages, about 4.6 people per name) showed retrieval-augmented LLMs blending facts from different people into one biography, in ways a reader couldn't easily spot — [arXiv 2402.05629, "Merging Facts, Crafting Fallacies"](https://arxiv.org/html/2402.05629v4)
- Errors cluster at the "entity switch point", where a passage shifts from one same-named person to another. Proposed mitigation: decontextualise each claim with disambiguating detail before verifying it ("molecular facts") — [arXiv 2406.20079](https://arxiv.org/pdf/2406.20079)
- The AmbigDocs benchmark grades whether a model separates or merges same-name entities — [arXiv 2404.12447](https://www.arxiv.org/pdf/2404.12447v1)
- **Deep-research agents (2025–2026):** ReportBench sorts failures into statement hallucination (text doesn't match its cited source) and citation hallucination (invented references), and observed misattributed authors and fabricated links, including from OpenAI Deep Research and Gemini 2.5 Pro — [arXiv 2508.15804](https://arxiv.org/pdf/2508.15804). DeepHalluBench (Jan 2026) found no robustly reliable agent among six tested, with early fabrications cascading through the research — [arXiv 2601.22984](https://arxiv.org/html/2601.22984). LiveResearchBench found that even top systems produce many unsupported claims, and scores invalid links, irrelevant links and unsupported claims separately — [arXiv 2510.14240](https://www.emergentmind.com/papers/2510.14240). DREAM warns that citation-faithfulness checks can pass claims that are actually false — [hyper.ai summary of arXiv 2602.18940](https://hyper.ai/de/papers/2602.18940)
- Reported citation-hallucination rates range from 18% to over 70% (AAAI 2026 student abstract, secondary) — [Underline](https://underline.io/lecture/138676-705-detecting-citation-hallucinations-in-large-language-model-outputs-student-abstract)

### Inferences
- Mitigations for this project, in pipeline order:
  1. **Seed from known identity, not the name.** Give the agent the full disambiguating description (name, title, company, LinkedIn URL, bio) and tell it to reject candidates with contradictions.
  2. **Quoted evidence is mandatory.** Each claim carries a source URL, the verbatim quote that supports it, and the quote that ties the source to the person (the employer/title or a self-link).
  3. **Mechanical verification.** A script (stdlib `urllib`, consistent with the repo's Python rules) fetches every URL, checks for HTTP 200 with no redirect to a homepage, and checks that the quoted text appears on the page. Anything that fails is dropped, not repaired.
  4. **Two-source rule.** A fact needs two independent sources, or one self-asserted source (the speaker's own site or LinkedIn, or an employer bio page).
  5. **Recency check.** Roles go stale: AfroTech bios and LinkedIn may lag a job change. Prefer the AfroTech 2026 listing for the current role, date-stamp every claim, and label older articles ("in 2023, as X at Y…").
  6. **One person per session.** Research each speaker in a fresh context so details from one speaker can't leak into another.
  7. **Human spot-check** of every "medium" item and a random sample of "high" items.
- The Tow Center finding that tools rarely abstain means "no result" should be an explicit, normal outcome in the agent prompt.

### Gaps
- I couldn't read the primary CJR article or the Nature paper directly (network block), so the figures come from search summaries. The per-tool CJR numbers vary between secondary sources.
- No study I found measures LLM conflation rates specifically for professional (non-Wikipedia-notable) people, the most common case among conference speakers. AmbigBio uses Wikipedia-notable names and 2024-era models.

## A practical confidence rubric and publishing rule

### Takeaway
Use three levels. Publish only **high**. Hold **medium** for human review. Discard **low**, and log it as "not this person" when a same-named person caused it. Skipping is the default when evidence is thin: a missing fact costs little, while a wrong one harms a real person and the site's credibility.

### Cited Findings
- Fellegi–Sunter decision rules use two thresholds that create match, non-match and a possible-match zone sent to clerical review — [Winkler, Census RR99-04](https://www.census.gov/content/dam/Census/library/working-papers/1999/adrm/rr99-04.pdf)
- BLP: statements about living people "should be sourced very carefully… for legal and ethical reasons", with a presumption in favour of privacy — [Wikipedia:BLP](https://www.wikipedia.org/wiki/WP:BLP); [Wikipedia:Citing sources (Simple)](https://simple.wikipedia.com/wiki/Wikipedia:Ref)
- Evidence that AI tools give confident wrong answers rather than abstaining — [CJR Tow Center](https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php)

### Inferences
- Proposed rubric (my synthesis, using the score from the record-linkage section):

| Level | Identity evidence | Claim evidence | Action |
|---|---|---|---|
| **High** | A self-asserted link or shared ID, **or** two independent sources each matching employer and title (or a distinctive bio fact); no contradictions | The URL resolves and contains the quoted claim; the claim is dated | Publish, with the source linked and dated |
| **Medium** | One identity signal (for example, employer match only), or a common name with weak corroboration, or an older role that doesn't match the current one | The claim was verified on the page | Hold for human review; publish only after upgrading to high |
| **Low** | Name match only, any unresolved contradiction, or the source can't be fetched | Paraphrase with no quote, or the URL is broken | Don't publish; log it if a same-named person was involved |

- **Skip rules:** skip the speaker entirely (show only the official AfroTech bio) when the name is common and no self-asserted link or ID exists. Also skip when every candidate source is undated or older than about 3 years and contradicts the current role, or when the only sources are people-search or data-broker sites.
- Personal websites: publish only if they're linked from the speaker's LinkedIn or AfroTech profile, or link back to it.
- Articles and talks: publish only if the byline or speaker listing carries the same employer or title for that date, or the speaker shares or links the piece themselves.

### Gaps
- No external source supplies a ready-made rubric for this setting. The table adapts Fellegi–Sunter thresholds and BLP sourcing norms.

## Name-handling issues for this population

### Takeaway
Expect hyphenated and double-barrelled surnames, married or maiden name changes, nicknames and initials, and non-Anglo names: West African, Caribbean, East African and Latin American naming orders, patronymics, and transliteration variants. Generate variants deliberately, but count a variant match only together with employer or bio corroboration. Use the name the speaker uses on AfroTech for display.

### Cited Findings
- Core name-matching problems include missing spaces or hyphens, initials, reordered components, truncation, nicknames and multilingual spellings ("Mary Ellen" / "MaryEllen" / "Mary-Ellen"; "Schütze" / "Schuetze"). A gender mismatch should block a match — [arXiv 2605.23597, structure-guided entity resolution](https://arxiv.org/pdf/2605.23597)
- Double-barrelled and hyphenated surnames add permutations. Family names can vary with sex and marital status, and naming practices vary widely: the personal name can come first or last, and a family name may be absent — [O'Reilly, Smart Matching for Human Names](https://www.oreilly.com/library/view/games-diversions/9781449398651/ch21.html)
- Name-matching libraries handle hyphenation (Smith-Curry = Curry) and nickname tables (Midge = Peggy = Margaret), but they may ignore gender — [Lingua::EN::MatchNames](https://web.do.metacpan.org/pod/Lingua::EN::MatchNames)
- Systems can learn variants such as "Greg Jones" = "Gregory H. Jones" — [USPTO patent 12619823](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12619823)
- ORCID lets researchers record aliases, which helps with name changes — [CASRAI](https://casrai.org/guides/author-name-disambiguation-orcid-algorithmic-matching-cris)
- Names with shared surnames and given names (Chinese names are the cited example) produce many homonyms, so name-based search breaks down at scale — [CASRAI](https://casrai.org/wp/?p=3238)

### Inferences
- For each speaker, generate a small variant list: with and without the hyphenated part, each half of a double surname, the initials form ("J. Smith"), a known nickname if the bio or LinkedIn uses one, the order swapped for names where the family name may come first, and common transliterations. Only the speaker's own LinkedIn or bio confirms that a variant belongs to them, for example "formerly", "née", or a previous name shown on LinkedIn.
- Don't infer maiden names or name changes from other sources (marriage records and similar). That's private information and crosses the ethical-OSINT line. Use a former name only if the speaker publishes it themselves.
- Very short or very common names (common English, Yoruba or Igbo given names paired with common surnames, and so on) need the strictest bar: a self-asserted link or shared ID.
- Don't "correct" spelling, diacritics or capitalisation. Keep the speaker's own form as given in the AfroTech data.

### Gaps
- I found no source specific to naming conventions in Black or African-diaspora tech communities, or to how often their names change. This section's guidance for that population is inference from general name-matching literature.
- Coverage of maiden names and cultural naming conventions was thin in the sources found.
