# Reliable public sources for conference speaker profiles

Research method note (Nov 3, 2026): this session's network allowlist blocked direct fetches of en.wikipedia.org, afrotech.com, podcastindex-org.github.io, blitzmetrics.com and source.opennews.org. Findings below therefore rest on web-search result summaries (snippets and the search tool's digest), not full-page reads, unless marked otherwise. Quotes from Wikipedia policy came through search-result copies of WP:BLP and WP:V; the live wording should be re-checked before quoting it on the site.

## 1. Which source types are most reliable and highest-coverage for professional facts?

### Takeaway
For a mid-career speaker population, the best sources are the speaker's own employer pages, their personal sites and third-party editorial pages (news, awards lists, other conference pages, podcast show notes). Rank them by independence: third-party editorial first; the subject's own pages for uncontroversial facts about themselves; user-submitted or scraped databases (Crunchbase, Google Scholar, people-search sites) only as leads to verify.

### Cited Findings
- **Wikipedia's BLP policy as a model.** A living person's own publications (press releases, personal websites) may be used about that person only if the material "is not unduly self-serving" and "does not involve claims about third parties." — [Wikipedia:Biographies of living persons (WP:BLP)](https://www.wikipedia.org/wiki/WP:BLP)
- WP:BLP: "Remove immediately any contentious material about a living person that is unsourced or poorly sourced… that relies on self-published sources, unless written by the subject." — [WP:BLP](https://www.wikipedia.org/wiki/WP:BLP)
- Wikipedia's verifiability policy: self-published sources "may be used as sources of information about themselves," but should "never" be used "as third-party sources about living people, even if the author is an expert." — [Wikipedia Verifiability (mirror)](https://static.hlt.bme.hu/semantics/external/pages/lemma/en.wikipedia.org/wiki/Wikipedia_Verifiability.html); also summarised at [WP:BLP](https://www.wikipedia.org/wiki/WP:BLP). The search digest noted a pending proposal to merge BLP's self-published section into WP:V, so wording may change.
- **Crunchbase is largely self-reported.** "A significant portion of the data is self-reported. Founders, investors, and employees submit and update their own profiles," and accuracy "varies by company and by field." — [FullEnrich: What is Crunchbase](https://fullenrich.com/tools/What-is-Crunchbase) (a competing data vendor, so biased). Users can add or edit data themselves. — [Crunchbase support: content guidelines](https://support.crunchbase.com/hc/en-us/articles/115011260487-What-are-the-guidelines-for-adding-content-to-Crunchbase)
- Crunchbase says it prefers correcting bad profiles to deleting them. — [Crunchbase support](https://support.crunchbase.com/hc/en-us/articles/360008319833)
- A field-level accuracy range of 71–93% for Crunchbase is attributed to a study by Alexander Jarasch. I could not verify the original study. — [FullEnrich: Crunchbase vs Proxycurl](https://fullenrich.com/tools/Crunchbase-vs-Proxycurl)
- Bloomberg (Feb 2022) reported that startups inflate or invent data in startup databases ("make stuff up") and that this troubles Crunchbase, CB Insights and PitchBook. — [Bloomberg](https://www.bloomberg.com/news/articles/2022-02-07/startup-data-integrity-vexes-crunchbase-cb-insights-pitchbook) (headline only; 2022, older)
- **ORCID.** It separates self-asserted items from "validated assertions" sent by trusted organisations (a university confirming employment, a publisher confirming authorship). Institution-asserted affiliations count as stronger evidence. — [CASRAI: ORCID trust markers](https://casrai.org/guides/orcid-trust-markers); [CASRAI: validated assertions](https://casrai.org/wp/tag/validated-assertions/)
- **Google Scholar.** Profiles use automated author attribution that can assign other people's work. One researcher found tarot papers under her name and needed six days of emails to fix it. — [Times Higher Education (2012, older)](https://www.timeshighereducation.com/node/109935). A December 2025 THE report found misattributed citations skewing leaderboards, usually through shared common surnames. — [THE](https://www.stg.timeshighereducation.com/node/740547)
- **AfroTech's own coverage.** The AFROTECH Future 50 is an annual list that began in 2022 with categories such as Dynamic Investor, Future Maker, Visionary Founder, Changemaker and Corporate Catalyst (2024). A "Meet the 2026 Future 50" page lists 50 honorees in 5 categories. — [Meet the 2026 Future 50](https://afrotech.com/meet-future-50); [2024 list](https://afrotech.com/meet-the-2024-afrotech-future-50); [2025 list](https://afrotech.com/meet-the-2025-afrotech-future-50-list); [2023 list](https://afrotech.com/listicle/afrotech-future-50-2023-honorees/); [Blavity Inc. on Future 50](https://blavityinc.com/afrotech-future-50-celebrating-black-changemakers-in-tech/)
- Future 50 is nomination-based ("submit to be considered"). — [2024 submissions page](https://afrotech.com/listicle/2024-afrotech-future-50-submit-to-be-considered/)
- **Podcast show notes and directories.** Podchaser tracks credited guest appearances. Listen Notes crawls RSS feeds and indexes episode descriptions and transcripts, so it casts a wider net. — [BlitzMetrics: Listen Notes guide](https://blitzmetrics.com/how-we-use-listen-notes-to-find-track-and-repurpose-every-podcast-appearance/) (search snippet only)

### Inferences
- Suggested source ranking for this site, highest first:
  1. **Third-party editorial**: news articles, awards and list pages (AfroTech Future 50, Forbes 30 Under 30, Root 100, Essence, Black Enterprise), other conferences' speaker pages, podcast show notes written by the host, university or publisher pages. These cover awards, notable projects, books and talks.
  2. **Employer pages**: leadership or team pages, company press releases, newsroom bios. Good for current title. Self-published by the organisation, but rarely contested.
  3. **The speaker's own channels**: personal site, Substack or Medium, their YouTube channel, GitHub. Fine for uncontroversial facts about themselves (the BLP "about self" test). Best source for the personal website field and for side projects.
  4. **User-submitted databases**: Crunchbase, Google Scholar, unvalidated ORCID entries. Use them as leads, then confirm in tier 1–3.
  5. **Excluded**: people-search and contact brokers, and AI bio or net-worth farms (section 5).
- Sessionboard bios and LinkedIn URLs are self-supplied. Treat them as tier 3: good for facts about the speaker, not for claims about other people or organisations.
- Wikipedia itself fits few of these speakers (section 4). Where a page exists, cite the source Wikipedia cites, not Wikipedia.

### Gaps
- I couldn't fetch afrotech.com, so I couldn't confirm how AfroTech profiles are structured (title, company, bio, dates) or whether articles carry bylines and dates.
- I found no independent comparison of company-page accuracy versus news coverage for titles.
- I didn't research book publisher pages, Forbes 30 Under 30, Root 100, Essence or Black Enterprise list pages directly. Their value as tier-1 sources is inferred from their being editorial lists.

## 2. What makes a good "fun fact" source, and which categories are safe?

### Takeaway
A good fun-fact source is dated, has a named publisher other than the speaker, and states the fact directly instead of implying it. Professional categories (award, book, notable project, first job told in an interview, side project, a cause the speaker champions publicly) are safe. Anything about family, health, wealth, age, religion or politics is not.

### Cited Findings
- WP:BLP bars "unduly self-serving" self-published material and claims about third parties. — [WP:BLP](https://www.wikipedia.org/wiki/WP:BLP)
- AI and spam bio sites present false wealth facts. One writer found a site claiming she was a millionaire, which she says she "is not and has never been." She warns that sites claiming inside information about "personality types, birthdays, astrology, or net worth" are often inaccurate. — [Diana Lang, "You Cannot Trust the Robots to Tell the Truth" (Sep 2025)](https://dianalangpoetry.com/2025/09/13/you-cannot-trust-the-robots-to-tell-the-truth/)
- Be cautious with websites that make "bold claims about personal relationships, family connections, or private details without citing verifiable data." — [Hillsdale-hosted guide to biographical information](https://aws.hillsdale.edu/biographical-information) (generic page; low authority)
- Journalism verification means getting details "confirmed by multiple sources." — [News Literacy Project classroom activity](https://newslit.org/wp-content/uploads/2020/01/Think-like-a-reporter-NLP-Classroom-Activity.pdf) (2020)
- Brooke Borel's *The Chicago Guide to Fact-Checking* (2nd ed., 2023) is the standard book-length reference; the 2nd edition adds audio/video sources and sensitive subjects. — [CiNii record](https://ci.nii.ac.jp/ncid/BC17024340)

### Inferences
- Criteria for a fun fact:
  - **Attribution.** Each fact links to a URL. Prefer a third party, or the speaker's own words in a third-party venue (a podcast interview, a news Q&A).
  - **Recency.** Dated within about 3 years for anything that changes (title, company, "currently building"). Awards, books and firsts don't expire but should carry their year ("named to the 2024 AfroTech Future 50").
  - **Primary over secondary.** Cite the awards page, not a blog post that repeats it.
  - **Phrased as stated in the source.** Don't infer or embellish.
- Safe categories: awards and lists (with year); books written (publisher page); patents; a notable product or project shipped; founding a company or nonprofit; first job or career pivot *as told by the speaker in an interview*; side projects (a podcast they host, a newsletter, an open-source repo); causes championed publicly (a board seat, a nonprofit they founded); a notable talk (TEDx, a keynote); alma mater when it's in their official bio.
- Avoid: net worth, age or birthday, family, health, religion, politics, home city beyond what the official bio says, and anything only on a people-search or bio-farm site. This also matches the repo's rule to keep organisers' personal contact details off the site.

### Gaps
- I found no published style guide specifically for "fun facts" on conference profiles. The categories above are my judgement, built from BLP principles.

## 3. How well do search engines surface these for mid-career professionals, and which query patterns work?

### Takeaway
Exact-name searches combined with the company name and a `site:` filter find most items. Podcasts need dedicated indexes (Listen Notes, Podchaser, Podcast Index), because general search misses episodes where the name appears only in show notes or transcripts. Name collisions are the main risk, so always anchor on the company or title.

### Cited Findings
- Listen Notes method: search the full name in quotes, read the Episodes tab for appearances and the Podcasts tab for shows they host. Listen Notes also searches transcripts, so it finds episodes where a name comes up only in conversation. — [BlitzMetrics](https://blitzmetrics.com/how-we-use-listen-notes-to-find-track-and-repurpose-every-podcast-appearance/) (snippet)
- Listen Notes and Podchaser both depend on RSS. A second guide recommends Google `site:` searches on podcast hosting platforms to fill gaps, and claims "62+" appearances missed by aggregators for its subject. — [BlitzMetrics: hidden podcast appearances](https://blitzmetrics.com/find-podcast-appearances-aggregators-miss/) (snippet; promotional source)
- Podcast Index: a third-party MCP wrapper offers `search_by_person`, which finds episodes where someone appears as host or guest. A related tool reads the Podcasting 2.0 `<podcast:person>` tag, which gives real credits rather than passing mentions. But only a minority of shows publish person tags, and the name must match as written. Needs free API credentials. — [Glama: podcastindex-mcp search_by_person](https://glama.ai/mcp/servers/conorbronsdon/podcastindex-mcp/tools/search_by_person); [Podcast Index MCP server](https://glama.ai/mcp/servers/conorbronsdon/podcastindex-mcp)
- `site:` limits results to one website and `intitle:` matches words in page titles; Bing, DuckDuckGo and Startpage support most of the same operators. — [CybelAngel: Google dorks for OSINT](https://cybelangel.com/blog/google-dorks-for-osint-security-teams-guide/); [Compass Security OSINT cheat sheet](https://compass-security.com/fileadmin/Datein/Research/White_Papers/osint_cheat_sheet.pdf)
- Listen Notes focuses on episode content, not detailed speaker profiles, so it may not give a full guest history on its own. — [Talks.co: Listen Notes alternatives (2026)](https://talks.co/p/listen-notes-alternatives/)

### Inferences
- Query patterns (not tested in this session):
  - Current role: `"First Last" "Company"`; `site:company.com "First Last"` (leadership page or newsroom).
  - Personal site: `"First Last"` plus `about`, `speaker`, `portfolio`; follow links from their LinkedIn "Contact info" or the Sessionboard bio. Confirm the site names the same employer.
  - News: `"First Last" "Company"` in Google News; `site:afrotech.com "First Last"`; `site:blavity.com`; `site:forbes.com`; `site:techcrunch.com`.
  - Awards: `"First Last" "30 Under 30"`, `"Future 50"`, `"Root 100"`, `"Black Enterprise"`.
  - Talks: `site:youtube.com "First Last" keynote OR panel OR talk`; `"First Last" speaker 2025 OR 2026`; other conferences (`site:sessionize.com "First Last"`).
  - Podcasts: Listen Notes `"First Last"` (Episodes tab); Podchaser credits; Podcast Index person search; then `"First Last" podcast "Company"` with `site:podcasts.apple.com`, `site:open.spotify.com` or `site:buzzsprout.com`.
  - Writing: `site:substack.com "First Last"`; `site:medium.com "First Last"`.
  - Academics: ORCID (prefer validated affiliations), the university faculty page, Google Scholar (confirm co-authors and institution).
- Every hit must match at least two identifiers (name plus current or past employer, title or photo) before it's used.

### Gaps
- I found no measurement of how often general search engines surface podcast or talk appearances for non-celebrities.
- I couldn't fetch the official Podcast Index API docs (podcastindex-org.github.io), so I couldn't confirm the `/search/byperson` endpoint's exact fields from the primary source.

## 4. What coverage should we expect (Wikipedia, personal sites, podcasts, news)?

### Takeaway
I found no direct statistic for a list like this one. The evidence points to low Wikipedia coverage, and lower for women and people of color. Expect a small minority of the ~273 speakers to have Wikipedia pages and most to need non-Wikipedia sources.

### Cited Findings
- Fewer than 19% of English Wikipedia's more than 1.5 million biographies of writers, inventors and academics are about women. — [UNC CITAP: "Ms. Categorized" (Tripodi)](https://citap.unc.edu/publications/ms-categorized-wikipedia/)
- In Tripodi's study of over 20,000 Articles for Deletion nominations, about one in four biographies of women were nominated for deletion, a larger share than women's share of biographies. — [UNC SILS news](https://sils.unc.edu/news/francesca-tripodi-spotlights-gender-inequality-on-wikipedia-in-recent-paper-and-interviews)
- Academics who are women and people of color are more likely to have their Wikipedia pages deleted, even with equal or greater online presence than white male peers. Women are more often labelled "too soon" to be notable. — [CITAP: "Too Soon" to Count?](https://citap.unc.edu/publication-tag/wikipedia)
- Clarice Phelps's page was deleted after a notability dispute. She is described as likely the first African American woman to help discover a chemical element. — [Undark (2019, older)](https://undark.org/2019/04/25/wikipedia-diversity-problem/)

### Inferences
- Rough expectations (judgement, not measured): Wikipedia pages for perhaps 5–15% (celebrities, well-known founders and executives, some academics). Most speakers who've appeared at AfroTech will have an employer page or news mention. A large share of founders, creators and investors will have podcast appearances. Personal sites are likeliest among creators, consultants and authors, and least likely among corporate engineers.
- Missing Wikipedia pages aren't a sign of low prominence for this population, because of documented bias in notability decisions. Don't use Wikipedia presence as a filter.
- Plan for gaps: a profile with zero verified extras should show only the official bio, not filler.

### Gaps
- No sourced percentage for Black professionals' Wikipedia coverage. One source says it's hard to determine but likely subject to the same disparity. — [Undark](https://undark.org/2019/04/25/wikipedia-diversity-problem/)
- No data on personal-site or podcast prevalence among tech professionals. A pilot on 20 random speakers would give real numbers.

## 5. Failure modes and sites to exclude

### Takeaway
The main risks are outdated titles, two people with the same name being merged, and low-quality aggregators: people-search sites, contact brokers, and AI bio and net-worth farms. Block those domains outright. Date every fact, and match every hit on two identifiers.

### Cited Findings
- **Data brokers.** Opt-out guides say brokers tend to collect data without verifying it. — [DeleteMe: RocketReach opt-out](https://joindeleteme.com/blog/rocketreach-opt-out-guide/). RocketReach is said to have "likely scraped" any professional information that exists online. — [DeleteMe](https://joindeleteme.com/opt-out-guides/rocketreach-opt-out-guide/). ZoomInfo aggregates from LinkedIn, company sites, press releases and directories. — [DeleteMe: remove yourself from ZoomInfo](https://joindeleteme.com/blog/how-to-remove-yourself-from-zoominfo/). Brokers republish profiles after opt-outs. — same. (DeleteMe sells removal services, so it's an interested source.)
- ZoomInfo users on Trustpilot describe contact data as outdated and inaccurate. — [Trustpilot](https://ie.trustpilot.com/review/zoominfo.com?page=4)
- **Spokeo.** The Center for Democracy and Technology filed an FTC complaint alleging Spokeo's results are inaccurate. It says Spokeo's founder admitted in press interviews that it is often inaccurate. This is an allegation, not a finding, and the date wasn't confirmed (it appears to be around 2010, so older). — [CSO Online](https://www.csoonline.com/article/547164/microsoft-subnet-ftc-to-probe-spokeo-data-broker-over-abuse-of-privacy.html)
- Broker profiles for both firms: [Redact: RocketReach](https://redact.dev/data-brokers/rocketreach-co); [Redact: ZoomInfo](https://redact.dev/data-brokers/zoominfo-com)
- **AI spam and fake news sites.** CybelAngel describes thousands of fake news sites that look credible, rank highly on Google and use AI-generated headshots for invented authors. — [CybelAngel](https://cybelangel.com/blog/ai-generated-fake-news-sites/)
- Lead Stories warns of fake fan pages spreading false stories about public figures. — [Lead Stories (Oct 2025)](https://leadstories.com/analysis/2025/10/fact-check-prebunk-beware-of-fake-fan-pages-spreading-false-claims.html)
- AI-generated biographies appear on Amazon, sometimes within a day of a celebrity's death. — [The Mary Sue](https://www.themarysue.com/a-i-s-latest-scam-is-publishing-fake-biographies-of-deceased-people/)
- **Name collisions.** Google Scholar misattributes work between academics with common surnames. — [THE, Dec 2025](https://www.stg.timeshighereducation.com/node/740547)
- **Self-reported inflation.** Startups make up or inflate data in startup databases. — [Bloomberg 2022](https://www.bloomberg.com/news/articles/2022-02-07/startup-data-integrity-vexes-crunchbase-cb-insights-pitchbook)

### Inferences
- Domain blocklist (never cite): Spokeo, ZoomInfo, RocketReach, Apollo.io, ContactOut, Lusha, SignalHire, Whitepages, BeenVerified, TruePeopleSearch, FastPeopleSearch, Radaris, PeopleFinders, Intelius, MyLife, ThatsThem, CelebsMoney-style net-worth and "age, height, wiki" bio farms, and scraped LinkedIn mirrors. Also no AI chat answers or AI search overviews used as sources.
- Signs of a bio farm: no byline or an invented author, net-worth, height or age fields, templated "Early life / Personal life" headings, no outbound citations, and the same text repeated across domains.
- Outdated titles: compare any title against the Sessionboard title (current as of the event). If a source shows a different employer, cite it only with its date ("then at X, 2023").
- Conflation: require two matching identifiers and check the photo against the Sessionboard photo where one is shown. Be extra careful with common names.
- Store each fact with `{text, url, publisher, published_or_accessed_date, source_tier}` so the site can show attribution and future reviews can re-check it.

### Gaps
- I found no systematic study of how common AI bio farms are in search results for non-celebrity names.
- I couldn't read AfroTech or Blavity's editorial or corrections policies (afrotech.com was unreachable).
