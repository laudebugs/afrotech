# APIs and structured-data services for enriching public speaker profiles (as of Nov 3, 2026)

Method note: this session's network policy blocked direct page fetches (developers.google.com, newsapi.org, listennotes.com, api-dashboard.search.brave.com all failed DNS). Findings below come from web-search results, which quote official pages where marked. Items stated from background knowledge are labelled as such and listed under Gaps for verification. Those hosts must be allowed in the session's network settings to verify against primary pages.

## Wikidata and Wikipedia

### Takeaway
Wikidata is the best-fit structured source: free, keyless and (per its well-known licensing) CC0. Expect low coverage of mid-career professionals, though. Most of the ~273 speakers won't have an item, and name matches need human disambiguation. Wikipedia summaries are usable only with CC BY-SA attribution.

### Cited Findings
- The Wikidata Query Service enforces a hard 60-second deadline per query — [WikidataQueryServiceR docs](https://search.r-project.org/CRAN/refmans/WikidataQueryServiceR/html/query_wikidata.html)
- Each client (user agent + IP) gets 60 seconds of processing time per 60-second window, and 30 error queries per minute; the docs point to the query-limits section of the WDQS User Manual on mediawiki.org as authoritative — [WikidataQueryServiceR PDF](https://search.r-project.org/CRAN/packages/WikidataQueryServiceR/WikidataQueryServiceR.pdf)

### Inferences
- From background knowledge (not verified this session): Wikidata's structured data is CC0, so no attribution is legally required (credit is still good practice). Wikipedia text is CC BY-SA 4.0: reusing a summary requires attribution (a link to the article/history), a licence notice, and share-alike for derivative text.
- From background knowledge: the useful properties are P856 (official website), P2002 (X/Twitter username), P6634 (LinkedIn personal profile ID), P108 (employer), P106 (occupation) and P39 (position held). Matching on P6634 against the known LinkedIn URL slug is the most reliable way to disambiguate. Use one batched SPARQL `VALUES` query over all 273 slugs rather than 273 name searches.
- `wbsearchentities` (name search) will return many false positives for common names. Treat a hit as a candidate for human review, not a match.
- A stdlib Python script (`urllib`) works fine. Send a descriptive User-Agent with contact info (Wikimedia policy), and use one request at a time.
- Wikipedia REST `page/summary/{title}` gives an extract plus a canonical URL. Store the URL to produce the required attribution link.

### Gaps
- Couldn't fetch the Wikidata:Licensing page, the Wikimedia User-Agent policy or the Wikipedia REST API docs to confirm the CC0/CC BY-SA terms, the REST rate limits (historically ~200 req/s) or the 2025–26 status of the REST endpoints. Wikimedia has been migrating some RESTBase endpoints, so check before building.
- No data on what share of AfroTech speakers have Wikidata items. Estimate it with a pilot query.

## Google Knowledge Graph Search API

### Takeaway
It appears still live with a free quota of 100,000 reads/day/project. No deprecation notice was found. It returns only notable entities, though, so few speakers will be in it, and its display/caching terms couldn't be verified.

### Cited Findings
- The Knowledge Graph Search API usage-limits page (last updated 2025-08-31) gives up to 100,000 read calls per day per project at no charge; more quota can be requested in the API Console — [Google KG usage limits (IT)](https://developers.google.com/knowledge-graph/reference/rest/v1/usage-limits?hl=it), [(FR)](https://developers.google.com/knowledge-graph/reference/rest/v1/usage-limits?hl=fr)
- Search found no deprecation notice for the KG Search API. Retirement notices found were for other Google APIs (the old Web Search API, Business Profile Q&A) — [Search Engine Land](https://searchengineland.com/google-web-search-api-longer-available-202188), [PPC Land](https://ppc.land/google-discontinues-business-profile-q-a-api-effective-november-3/)

### Inferences
- From background knowledge: results carry a `detailedDescription` sourced from Wikipedia (with its CC BY-SA licence URL) and a KG `@id`. It adds little beyond Wikidata/Wikipedia for this use, and the Google APIs Terms of Service govern caching and display.

### Gaps
- Couldn't confirm the current KG Search API terms on caching/display or whether new projects can still enable it in 2026 (Custom Search began rejecting new projects; see Web search below).

## Crunchbase API

### Takeaway
Not practical. Person/people data requires a sales-negotiated Enterprise or Applications licence, reportedly $30k–$50k+ per year. Free/Basic access has reportedly been cut back or discontinued, and republishing licensed data on a public site would need explicit contract terms.

### Cited Findings
- Crunchbase's "Using the API" page is quoted as saying: "Access to the Full API Requires an Enterprise or Applications License"; Basic reportedly gives 3 endpoints — [Nubela](https://nubela.co/blog/crunchbase-api/)
- Crunchbase reportedly eliminated free API access in 2025 and no longer issues new Basic keys — [ZoomInfo Pipeline](https://pipeline.zoominfo.com/sales/crunchbase-api); conflicting with Nubela, which says support docs still let Basic users provision a key — [Nubela](https://nubela.co/blog/crunchbase-api/)
- A Basic key returns 403 for PostHog's connector, which requires Enterprise/Applications — [PostHog docs](https://posthog.com/docs/cdp/sources/crunchbase.md)
- Enterprise contracts typically start at $50,000+/year — [Vendr](https://www.vendr.com/marketplace/crunchbase); another estimate puts them from $30,000/year — [Multiples](https://multiples.vc/compare/crunchbase-api-alternatives/md)

### Inferences
- Even with a licence, Crunchbase's licence terms likely restrict redistributing data on a public site. Assume no unless the contract says otherwise.

### Gaps
- Couldn't read Crunchbase's current terms of service or API licence text on redistribution/attribution.

## LinkedIn: official API and scraping law

### Takeaway
There is no official route to read other people's profile data without a LinkedIn partnership, and scraping carries real contract-law risk. The hiQ case ended with hiQ found in breach of the User Agreement and permanently enjoined, and LinkedIn has since shut down Proxycurl and sued other scrapers. Use the LinkedIn URLs only as links and as a Wikidata (P6634) join key.

### Cited Findings
- In Nov 2022 the court found hiQ breached LinkedIn's User Agreement by scraping and by using fake profiles. hiQ had agreed to the terms when creating its corporate account — [ZwillGen](https://www.zwillgen.com/alternative-data/hiq-v-linkedin-wrapped-up-web-scraping-lessons-learned/)
- Dec 2022 consent judgment: a $500,000 judgment against hiQ, a permanent injunction, an order to stop scraping, and deletion of the code and data derived from scraping; other claims settled confidentially; the stipulation has no precedential value — [National Law Review](https://www.natlawreview.com/article/linkedin-s-data-scraping-battle-hiq-labs-ends-proposed-judgment), [Morgan Lewis](https://www.morganlewis.com/blogs/sourcingatmorganlewis/2022/12/linkedin-v-hiq-landmark-data-scraping-suit-provides-guidance-to-data-scrapers-and-web-operators)
- Commentators split: some read the case as "scraping public sites is legal in some circumstances" (the earlier Ninth Circuit CFAA ruling), while others stress that contract claims remain available — [Proskauer](https://newmedialaw.proskauer.com/tag/user-agreement/)
- LinkedIn sued Proxycurl in Jan 2025, alleging fake accounts were used to scrape (including non-public data) for resale; Proxycurl shut down ~July 4, 2025 under a settlement — [Social Media Today](https://www.socialmediatoday.com/news/linkedin-wins-legal-case-data-scrapers-proxycurl/756101/), [Nubela "Goodbye Proxycurl"](https://nubela.co/blog/goodbye-proxycurl/)
- LinkedIn sued ProAPIs Inc. in Oct 2025 on similar claims — [Bloomberg Law](https://news.bloomberglaw.com/artificial-intelligence/linkedins-war-against-bot-scrapers-ramps-up-as-ai-gets-smarter)

### Inferences
- From background knowledge: LinkedIn's self-serve APIs (Sign In with LinkedIn/OpenID Connect) return only the authenticated member's own basic profile. They don't support looking up arbitrary members. Broader profile APIs need partner-programme approval. The User Agreement (§8.2) prohibits scraping and copying profiles.
- A speaker opting in via "Sign in with LinkedIn" is the only clean official path, and it doesn't suit a static site with no sign-in.

### Gaps
- Couldn't fetch LinkedIn's developer docs or User Agreement to quote the current 2026 wording.

## YouTube Data API v3

### Takeaway
It's free with a default 10,000 units/day. Search is the expensive call: either 100 units per search.list (classic model) or a separate 100-searches/day bucket (newer docs), so 273 speakers need 3 days or a quota increase. The developer policies reportedly require refreshing or deleting stored API data within 30 days, which conflicts with committing results to a static site unless they're re-fetched.

### Cited Findings
- Google's getting-started page reportedly lists default projects at 100 search.list calls, 100 videos.insert calls, and 10,000 units/day for all other endpoints; other guides still describe search.list as 100 units from one 10,000-unit pool, and defaults are "subject to change" — [YouTube Data API Overview](https://developers.google.com/youtube/v3/getting-started), [apiserpent](https://apiserpent.com/blog/free-youtube-search-api)
- Secondary sources say the developer policies bar storing most API data longer than 30 days without refreshing or deleting it — [ppc.land](https://ppc.land/youtube-data-api/)

### Inferences
- Storing only video IDs/URLs chosen by a human reviewer, and linking out to YouTube, is likely lower-risk than caching titles/thumbnails/statistics. Re-running the build script every <30 days would refresh any stored metadata.
- Search by name returns lots of noise (common names), so query `"Full Name" + company` or `"Full Name" AfroTech`.

### Gaps
- Couldn't read the YouTube API Services Developer Policies or Terms directly to confirm the 30-day rule's scope, branding/attribution rules, or the current search quota model.

## Podcast discovery: Podcast Index, Listen Notes, Apple

### Takeaway
Podcast Index (free key) and Apple's iTunes Search API (keyless, ~20 calls/min) cover show and episode search cheaply. Listen Notes is the only one with explicit person-oriented search, but its free tier is 300 requests/month, and server-side caching is allowed only on Enterprise. Committing results to a static site is therefore problematic on Free/Pro.

### Cited Findings
- Podcast Index issues a free API key + secret with no approval; clients must send an identifying User-Agent (third-party docs, not official) — [podcast-index-api README](https://cdn.jsdelivr.net/npm/podcast-index-api@2.0.0/README.md), [Glama MCP](https://glama.ai/mcp/servers/navidmoazzez/podcastindex-mcp)
- Listen Notes FREE plan: $0, 300 requests/month, search results capped at 30 reachable results (offset < 30), and access is suspended once the quota is exceeded — [Listen Notes pricing](https://www.listennotes.com/api/pricing/), [apis.io rate limits](https://apis.io/rate-limits/listennotes/listennotes-rate-limits/)
- Listen Notes: permission for server-side caching appears only under the ENTERPRISE plan; PRO overage starts at $1.60 per extra 1,000 requests after a base fee — [Listen Notes pricing](https://www.listennotes.com/api/pricing/), [apis.io plans](https://apis.io/plans/listennotes/listennotes-plans-pricing/)
- Apple's iTunes Search API is limited to ~20 calls/minute (subject to change), and Apple recommends caching search/lookup results; developers report 403s at ~30/min — [Apple Performance Partners](https://performance-partners.apple.com/resources/documentation/itunes-store-web-service-search-api/), [Apple Developer Forums](https://developer.apple.com/forums/thread/66399?page=2)

### Inferences
- From background knowledge: Podcast Index authenticates with an SHA-1 hash of key+secret+unix time in headers (easy in stdlib `hashlib`). It has a `search/byperson` endpoint that matches the `podcast:person` tag and episode text. Its data is open (the index is offered as a public download).
- Apple's API searches show/episode metadata, not guests. It mainly helps find podcasts a speaker hosts.

### Gaps
- Couldn't confirm Listen Notes' attribution ("Powered by Listen Notes") requirement, or Podcast Index's formal terms and rate limits, from primary pages.

## News: GDELT DOC API, NewsAPI.org, Google News RSS

### Takeaway
GDELT DOC 2.0 is free and keyless but rate-limited (~1 request per 5 seconds). NewsAPI's free Developer plan explicitly forbids staging/production use, so it can't feed even a build script for a live site without a paid plan (~$449/mo reported). Google News RSS is meant for personal, non-commercial use.

### Cited Findings
- GDELT DOC API needs no key; its 429s ask for roughly one request every 5 seconds — [finance-query GDELT client](https://docs.rs/crate/finance-query/3.0.0/source/src/adapters/gdelt/client.rs)
- GDELT says its APIs are rate-limited to protect its Elasticsearch clusters and recommends Web NGrams 3.0 for heavy users — [GDELT blog](https://blog.gdeltproject.org/?p=15416); DOC 2.0 supports searching a rolling window (blog announces 1.5-year searching) — [GDELT blog](https://blog.gdeltproject.org/doc-2-0-updates-1-5-year-searching-and-updated-mobile-interface/)
- IP-level blocks reportedly last longer than the violation — [HackerNoon](https://hackernoon.com/lang/zh/building-a-pipeline-to-study-war-coverage-using-gdelt)
- NewsAPI Developer plan: free "for development and testing," 24-hour article delay, "cannot be used in a staging or production environment (including internally)" — [NewsAPI pricing](https://newsapi.org/pricing)
- Third-party sources report 100 requests/day, ~1 month of history, and Business at ~$449/month — [apicostcalc](https://apicostcalc.com/newsapi.html), [freetier.co](https://freetier.co/directory/products/news-api)
- Google News RSS feeds are reportedly limited to personal, non-commercial use in a feed reader; commercial republication isn't permitted — [Fullpress](https://www.fullpress.it/en/rss-feed-google-news-illegal-commercial-republication/), [Ben Metcalfe (2005)](https://benmetcalfe.com/blog/2005/08/goole-news-rss-opens-up-a-whole-set-of-rights-issues/?amp=1)

### Inferences
- GDELT returns article URLs/titles (not full text). It suits "recent articles mentioning X" candidates for human review, but name-matching noise is high. Linking out to articles (headline + URL) is safer than copying text.
- A non-commercial community site might argue for Google News RSS use, but republishing results on a public site goes beyond "personal feed reader" use. Avoid it.

### Gaps
- No primary text for Google News RSS terms or GDELT's licence/attribution terms (GDELT is generally described as open with citation requested; unverified).

## People-data APIs (People Data Labs, Proxycurl and others)

### Takeaway
Avoid them. Proxycurl is gone (July 2025, after LinkedIn's suit). People Data Labs is a registered data broker whose records include emails, phones and birth dates. Using broker data conflicts with the project's rule against publishing personal contact details, and makes the site a downstream user of scraped/brokered data.

### Cited Findings
- People Data Labs is on California's official data broker registry — [CA AG registry](https://oag.ca.gov/data-broker/registration/190662)
- A third-party site reports PDL collects names, birth dates, emails, phone numbers and ad IDs, and processed 218,788 deletion requests in 2024 (unverified against the registry) — [offlist.me](https://www.offlist.me/ca-broker/people-data-labs)
- The California Delete Act creates a single deletion mechanism that registered brokers must honour, with fines of $200/day for failing to register; enforcement moved to the CPPA; deletion obligations start in 2026, audits in 2028 — [Fisher Phillips](https://www.fisherphillips.com/en/news-insights/5-biggest-questions-data-collection-industry.html), [Mondaq](https://www.mondaq.com/unitedstates/privacy-protection/1370142/californias-delete-act-takes-aim-at-data-brokers)
- Proxycurl shut down ~July 2025 under a LinkedIn settlement; its team moved to NinjaPear, which says it does not scrape LinkedIn — [Nubela](https://nubela.co/blog/goodbye-proxycurl/), [ZoomInfo Pipeline](https://pipeline.zoominfo.com/sales/proxycurl-review)

### Inferences
- Many "Proxycurl alternative" LinkedIn APIs in 2026 likely rely on the same scraping that LinkedIn is litigating. Speakers whose data is deleted via the Delete Act could still reappear through a cached enrichment, which is a reputational risk for a community site.

### Gaps
- Didn't verify PDL's current pricing, licence terms on republishing, or the live status of California's DROP deletion platform.

## Web search APIs (Brave, Bing, Google Programmable Search)

### Takeaway
Bing Search APIs were retired Aug 11, 2025. Google's Custom Search JSON API is closed to new customers and shuts down Jan 1, 2027. Brave Search API is the main remaining self-serve option: about $5/month of free credit (~1,000 queries, card required), then roughly $4–5 per 1,000 queries.

### Cited Findings
- Microsoft retired Bing Search and Bing Custom Search APIs on Aug 11, 2025 (notice May 12, 2025), with full decommissioning and no new sign-ups; it recommends "Grounding with Bing Search" in Azure AI Agents — [Microsoft Learn lifecycle](https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement), [The Register](https://www.theregister.com/2025/05/15/bing_search_apis_retired/)
- Google's overview page says the Custom Search JSON API isn't available to new customers; existing customers can use it until it is discontinued on Jan 1, 2027; Vertex AI Search is suggested for searching up to 50 domains — [Firecrawl](https://www.firecrawl.dev/blog/google-search-json-api-alternative), [Brave](https://brave.com/learn/google-api-shutdown/)
- The date it closed to new customers conflicts: Jan 20, 2026 per Firecrawl, vs 2025 per others — [Firecrawl](https://www.firecrawl.dev/blog/google-search-json-api-alternative); [getairefs](https://getairefs.com/blog/best-serp-apis/); new projects get 403 PERMISSION_DENIED — [Google Developer forum](https://discuss.google.dev/t/custom-search-json-api-returns-403-permission-denied-on-new-org-new-account-restriction/347093)
- Brave: the 2,000-queries/month free tier was reportedly dropped in Feb 2026 for $5 monthly credits (~1,000 queries), card required, with no spending cap on overage — [apiserpent](https://apiserpent.com/blog/free-brave-search-api), [agentdeals](https://agentdeals.dev/vendor/brave-search-api)
- Brave paid pricing reportedly fell to $5 per 1K (from $30) in May 2026; $4–5 per 1K as of Aug 2026 — [CostBench changelog](https://costbench.com/changelog/brave-search-api-price-decrease-2026-05/), [CostBench](https://costbench.com/software/ai-search-apis/brave-search-api/)

### Inferences
- 273 speakers × 2–3 queries fits inside Brave's monthly credit. From background knowledge, Brave's terms have restricted storing results unless your plan includes storage rights; check before committing results to `data/`.
- Search results are leads for a human reviewer (personal site, talks). Publish only the chosen URLs, not the result snippets.

### Gaps
- Couldn't open Brave's official pricing or terms page (blocked) to confirm the free credit, rate limits (historically 1 query/sec on free) or the storage/caching rights.
