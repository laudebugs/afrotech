# Speaker research pilot: 17 of 20 speakers gained something, all still drafts

The pilot researched 20 speakers from the Main Stage and other headline
sessions, following the [research report](../../reports/Speaker%20profile%20research%20sources.md).
Seventeen gained at least one fact, article or website worth reviewing; the
three who gained nothing are mid-career engineers at large companies, which
matches what the report predicted. Nothing is published yet: every row is a
draft until a person approves it.

## What the pilot found

| Measure | Result |
|---------|--------|
| Speakers researched | 20 (Rep. Ayanna Pressley skipped: her career is politics, which the rules keep off profiles) |
| Identity confidence | 13 high, 4 medium, 3 low |
| Speakers with something to review | 17 |
| Rows to review | 75: 33 facts, 41 articles or talks, 1 website |
| Speakers with nothing | Jonathan Yeldell (AWS), Olukunle Owolabi (Meta), Nicole Murray (NVIDIA) |

**Every quote still needs checking.** This session's network blocked the
source pages, so the researchers worked from search results only. Each row's
`quote_seen_in` says `search-snippet`, and some quotes may be slightly
summarised rather than word for word. `scripts/check_research.py` confirms each
quote on its page, but it needs those news sites reachable, which they aren't
from this sandbox. Run it from your own machine or a session with the domains
allowed.

**Notes worth reading before approving:**

- **Chris Lyons:** no source confirms the title "President, a16z Halo". One
  unreliable site claims he left a16z in 2026; it isn't cited and shouldn't be.
- **Simone Tyler:** older sources name Blavity's SVP as "Simone White",
  probably an earlier name; those sources weren't used.
- **Steve Stoute, Esosa Osa, Ryan Wilson:** some sources are Blavity or
  AfroTech properties, so they aren't independent.
- **TK Petersen, Ryan Wilson, Michelle Grover:** a few identity quotes are only
  a company name or a URL slug; confirm the person is named on the page.
- Each speaker's `notes` field in `data/sources/speaker-research.json` lists
  what was skipped and why (personal details, unreliable sites, same-name
  people).

## How to approve or reject rows

1. Open `data/sources/speaker-research.json` and find the speaker.
2. For each row you've checked, change `"status": "draft"` to `"approved"`, or
   to `"rejected"` to keep it out for good.
3. Run `python3 scripts/check_research.py <slug>`; any approved row that fails
   its check stops with an error.
4. Commit. The next build shows approved rows in the speaker's
   "Community-compiled" section, each linked to its source.

## Review table

| Speaker | Identity | Kind | Fact or title | Source | Tier | Quote seen in | Status |
|---|---|---|---|---|---|---|---|
| Morgan Debaun | high | Fact | Landed on the Forbes 30 Under 30 media list in 2016, two years after launching Blavity. | [Nieman Lab](https://www.niemanlab.org/2016/07/morgan-debaun-on-the-growth-of-blavity-covering-blacklivesmatter-and-the-state-of-black-owned-media/) | 1 | search-snippet | draft |
| Morgan Debaun | high | Fact | Her first book, Rewrite Your Rules, came out from Ballantine in April 2025, built on a three-part 'Master Yourself' framework. | [Black Enterprise](https://blackenterprise.com/blavity-morgan-debaun-rewrite-your-stars) | 1 | search-snippet | draft |
| Morgan Debaun | high | Article | Blavity CEO Morgan DeBaun on AfroTech and Black startup founders | [Fortune](https://www.fortune.com/2024/11/22/blavity-ceo-morgan-debaun-afrotech-startup-founders-black-tech) | | search-snippet | draft |
| Morgan Debaun | high | Podcast | Morgan DeBaun on Earn Your Leisure: the #1 career to get into before it's too late | [Earn Your Leisure (EYL Network)](https://omny.fm/shows/earn-your-leisure-1/morgan-debaun) | | search-snippet | draft |
| Morgan Debaun | high | Talk | Rewrite the Rules: Morgan DeBaun and Chamillionaire bring candid conversation to Houston | [Houston Forward Times](https://www.forwardtimes.com/news/rewrite-the-rules-morgan-debaun-and-chamillionaire-bring-candid-conversation-to-houston/article_343178bf-8338-40d9-9266-83ad0e81ae6d.html) | | search-snippet | draft |
| Dr. Timnit Gebru | high | Fact | Co-founded the Black in AI community before she ever joined Google. | [Democracy Now!](https://democracynow.org/2026/8/13/timnit_gebru) | 1 | search-snippet | draft |
| Dr. Timnit Gebru | high | Fact | Co-wrote 'Gender Shades' (2018) with Joy Buolamwini, the study that exposed skin-tone and gender bias in face-analysis software. | [NBC News](https://www.nbcnews.com/news/amp/rcna13339) | 1 | search-snippet | draft |
| Dr. Timnit Gebru | high | Talk | Timnit Gebru interview | [Democracy Now!](https://democracynow.org/2026/8/13/timnit_gebru) | | search-snippet | draft |
| Dr. Timnit Gebru | high | Article | How a Black Woman is Making AI a Force for Equity | [Robert Wood Johnson Foundation](https://www.rwjf.org/en/grants/grantee-stories/2025/09/how-a-black-woman-is-making-ai-a-force-for-equity.html) | | search-snippet | draft |
| Dr. Timnit Gebru | high | Article | Ethiopian-born computer scientist Timnit Gebru's debut book Deep Unlearning is now available for preorder | [Brittle Paper](https://brittlepaper.com/2026/08/ethiopian-born-computer-scientist-timnit-gebrus-debut-book-deep-unlearning-is-now-available-for-preorder/) | | search-snippet | draft |
| X Eyee | medium | Fact | Founded Google's Skin Tone research team, which built new techniques to reduce bias in AI systems. | [San Diego Community College District](https://www.sdccd.edu/departments/communications/newscenter/articles/2026/ai-day-event.aspx) | 1 | search-snippet | draft |
| X Eyee | medium | Fact | A California community college alum, she returned to keynote San Diego's 2026 InnovAItion Day on AI. | [San Diego Community College District](https://www.sdccd.edu/departments/communications/newscenter/articles/2026/ai-day-event.aspx) | 1 | search-snippet | draft |
| X Eyee | medium | Talk | Community college alumna, award-winning AI expert to headline second annual InnovAItion Day | [San Diego Community College District](https://www.sdccd.edu/departments/communications/newscenter/articles/2026/ai-day-event.aspx) | | search-snippet | draft |
| X Eyee | medium | Talk | Milken Institute Global Conference 2024 speaker: X Eyee | [Milken Institute](https://milkeninstitute.org/events/global-conference-2024/speakers/x-eyee) | | search-snippet | draft |
| X Eyee | medium | Article | Black History Month & Pride: Meet X Eyee | [BET](https://www.bet.com/article/e4e7qz/black-history-month-pride-meet-x-eyee) | | search-snippet | draft |
| Esosa Osa | high | Fact | Her Onyx Impact team mapped 2,500 online accounts spreading disinformation to Black communities over four months. | [NBC News](https://www.nbcnews.com/news/nbcblk/black-americans-disinformation-election-social-media-rcna157096) | 1 | search-snippet | draft |
| Esosa Osa | high | Fact | In 2025 she launched Onyx's Information Integrity Lab, pairing influencers with legacy Black newspapers to fight disinformation. | [Axios](https://www.axios.com/2025/08/06/onyx-impact-disinformation-lab-black-communities) | 1 | search-snippet | draft |
| Esosa Osa | high | Fact | Onyx backs its work with the Digital Green Book, an AI tool for spotting misinformation and finding verified Black content. | [Blavity](https://blavity.com/digital-green-book-misinformation) | 1 | search-snippet | draft |
| Esosa Osa | high | Article | SCOOP: Onyx Impact launches disinformation lab for Black communities | [Axios](https://www.axios.com/2025/08/06/onyx-impact-disinformation-lab-black-communities) | | search-snippet | draft |
| Esosa Osa | high | Article | New report reveals how disinformation targets Black communities | [WABE](https://www.wabe.org/new-report-reveals-how-disinformation-targets-black-communities/) | | search-snippet | draft |
| Esosa Osa | high | Article | Black Americans and disinformation in the election | [NBC News](https://www.nbcnews.com/news/nbcblk/black-americans-disinformation-election-social-media-rcna157096) | | search-snippet | draft |
| King Willonius | high | Fact | Made the original 'BBL Drizzy' track with the AI music tool Udio in April 2024, before Metro Boomin sampled it. | [MusicTech](https://musictech.com/news/music/king-willonius-ai-bbl-drizzy-metro-boomin/) | 1 | search-snippet | draft |
| King Willonius | high | Fact | Metro Boomin's May 2024 'BBL Drizzy' beat sampled his track without knowing it was AI-made. | [XXL](https://www.xxlmag.com/udio-ai-sued-metro-boomin-bbl-drizzy-drake-diss-riaa/) | 1 | search-snippet | draft |
| King Willonius | high | Fact | Was the only comedian on TIME's 2024 TIME100 AI list, in the Innovators category. | [Creativity Squared](https://creativitysquared.beehiiv.com/p/king-willonius-knows-how-to-manifest-do-you) | 1 | search-snippet | draft |
| King Willonius | high | Article | How Will Hatcher, aka King Willonius, created hit AI song about Drake | [Ad Age](https://adage.com/events-awards/tech-power-list/aa-willhatcher-tool) | | search-snippet | draft |
| King Willonius | high | Talk | The genius behind “BBL Drizzy” on maximizing creativity with AI | [Big Think](https://bigthink.com/series/legends/willonius-hatcher/) | | search-snippet | draft |
| King Willonius | high | Article | How to go viral: King Willonius on BBL Drizzy | [The Next Web](https://thenextweb.com/news/how-to-go-viral-king-willonius-bbl-drizzy) | | search-snippet | draft |
| Simone Tyler | high | Fact | Beyond AfroTech, she's led Blavity's Talent Infusion and helped launch HealthStack, a newer initiative at the meeting point of tech and well-being. | [Boston Medical Center (BMC)](https://www.bmc.org/node/178523) | 1 | search-snippet | draft |
| Simone Tyler | high | Fact | A Howard alum, she has called AfroTech a "tech homecoming" for HBCU graduates on Howard's own HU2U podcast. | [Howard University (HU2U podcast)](https://howard.edu/podcast/s2/gen-ai-mini-series/e3/how-our-alumni-wielding-ai-entrepreneurship-big-tech) | 1 | search-snippet | draft |
| Simone Tyler | high | Podcast | The GenAI Revolution, Ep 3: How our Alumni are Wielding AI in Entrepreneurship and Big Tech | [Howard University (HU2U podcast)](https://howard.edu/podcast/s2/gen-ai-mini-series/e3/how-our-alumni-wielding-ai-entrepreneurship-big-tech) | | search-snippet | draft |
| Simone Tyler | high | Article | What to expect at AfroTech 2024 | [Essence](https://www.essence.com/news/money-career/what-to-expect-afrotech-2024/) | | search-snippet | draft |
| Simone Tyler | high | Article | What you missed so far at AfroTech Conference 2025 | [AfroTech (Blavity)](https://afrotech.com/what-you-missed-so-far-afrotech-conference-2025) | | search-snippet | draft |
| Troy Millings | high | Fact | He co-wrote You Deserve to Be Rich with Rashad Bilal, which became an instant New York Times bestseller. | [Profile Books](https://profilebooks.com/work/you-deserve-to-be-rich/) | 2 | search-snippet | draft |
| Troy Millings | high | Fact | A second book with Rashad Bilal, Get Rich From Relationships, is due from Penguin Random House's Crown Currency in January 2027. | [Black Enterprise](https://www.blackenterprise.com/earn-your-leisure-founders-announce-new-book/) | 1 | search-snippet | draft |
| Troy Millings | high | Fact | Before EYL took off, he and Rashad Bilal taught financial literacy to public school students in the Bronx. | [Black Enterprise](https://www.blackenterprise.com/how-earn-your-leisure-financial-literacy-culture/) | 1 | search-snippet | draft |
| Troy Millings | high | Article | Earn Your Leisure founders announce new book | [Black Enterprise](https://www.blackenterprise.com/earn-your-leisure-founders-announce-new-book/) | | search-snippet | draft |
| Troy Millings | high | Article | Earn Your Leisure, Steve Harvey and Invest Fest 2025 | [Vibe](https://www.vibe.com/news/events/earn-your-leisure-steve-harvey-invest-fest-2025-1235076421) | | search-snippet | draft |
| Troy Millings | high | Podcast | Why financial literacy can't wait with Earn Your Leisure (Perspektives with Bank) | [Perspektives with Bank](https://omny.fm/shows/perspektives/why-financial-literacy-cant-wait-with-earn-your-leisure) | | search-snippet | draft |
| Rashad Bilal | high | Fact | He co-wrote You Deserve to Be Rich with Troy Millings, which became an instant New York Times bestseller. | [Profile Books](https://profilebooks.com/work/you-deserve-to-be-rich/) | 2 | search-snippet | draft |
| Rashad Bilal | high | Fact | His next book with Troy Millings, Get Rich From Relationships, is about building a winner's circle and lands in January 2027. | [Black Enterprise](https://www.blackenterprise.com/earn-your-leisure-founders-announce-new-book/) | 1 | search-snippet | draft |
| Rashad Bilal | high | Podcast | You Deserve to Be Rich with Earn Your Leisure's Rashad Bilal (The Money Mondays) | [The Money Mondays (Dan Fleyshman)](https://podcastrex.com/shows/the-money-mondays/you-deserve-to-be-rich-with-earn-your-leisures-rashad-bilal-e155) | | search-snippet | draft |
| Rashad Bilal | high | Article | Earn Your Leisure founders announce new book | [Black Enterprise](https://www.blackenterprise.com/earn-your-leisure-founders-announce-new-book/) | | search-snippet | draft |
| TK Petersen | medium | Fact | The Gathering Spot, which he co-founded, has hosted more than 3,000 events for clients including Netflix, Google, Spotify and Coca-Cola. | [The Virgin Islands Consortium](https://viconsortium.com/VIC/?p=72443) | 1 | search-snippet | draft |
| TK Petersen | medium | Article | How The Gathering Spot evolved over 10 years into an Atlanta civic hub | [The Atlanta Journal-Constitution](https://www.ajc.com/business/2026/04/how-the-gathering-spot-evolved-over-10-years-into-an-atlanta-civic-hub/) | | search-snippet | draft |
| Ryan Wilson | high | Fact | In 2019 The Gathering Spot and Paul Judge Media Group took a combined majority stake in A3C, Atlanta's long-running hip-hop festival and conference. | [Respect Magazine](https://respect-mag.com/2019/01/atlantas-a3c-festival-conference-finalize-strategic-investment-deal-with-the-gathering-spot-and-paul-judge-media-group-in-preparation-for-15th-anniversary) | 1 | search-snippet | draft |
| Ryan Wilson | high | Fact | He serves on Georgetown University's Board of Regents, giving back to the school where he earned both his undergrad and law degrees. | [Hope Global Forums](https://hopeglobalforums.org/speaker/ryan-wilson/) | 1 | search-snippet | draft |
| Ryan Wilson | high | Fact | In 2025 The Gathering Spot raised $30 million, $25M equity and $5M debt, to grow its locations and programming. | [AfroTech](https://afrotech.com/the-gathering-spot-secures-new-strategic-funding) | 1 | search-snippet | draft |
| Ryan Wilson | high | Article | The Gathering Spot Secures Spot As A Leader In Social Clubs With $30M Investment And Heavy-Hitting Support | [Black Enterprise](https://www.blackenterprise.com/gathering-spot-secures-30m-funding) | | search-snippet | draft |
| Ryan Wilson | high | Article | Ryan Wilson is on a mission to scale Black excellence | [Revolt](https://www.revolt.tv/article/ryan-wilson-is-on-a-mission-to-scale-black-excellence) | | search-snippet | draft |
| Ryan Wilson | high | Article | How The Gathering Spot evolved over 10 years into an Atlanta civic hub | [The Atlanta Journal-Constitution](https://www.ajc.com/business/2026/04/how-the-gathering-spot-evolved-over-10-years-into-an-atlanta-civic-hub/) | | search-snippet | draft |
| Arielle Clay Poteau | medium | Fact | As Deputy Editor at Blavity's 21Ninety, she led lifestyle coverage of beauty, fashion and relationships. | [21Ninety (Blavity Inc.)](https://21ninety.com/author/arielle-poteau) | 2 | search-snippet | draft |
| Arielle Clay Poteau | medium | Article | Summit21 2025 Proved Why Black Women Deserve the World | [21Ninety](https://21ninety.com/summit21-house-blavity-fest-2025) | | search-snippet | draft |
| Arielle Clay Poteau | medium | Article | Celebrating the Best Wellness Podcasts Centering Black Women’s Health | [21Ninety](https://21ninety.com/best-wellness-podcasts) | | search-snippet | draft |
| Vic Mensa | high | Fact | He co-organized the first Black Star Line Festival with Chance the Rapper, a free Accra concert that drew more than 50,000 fans in January 2023. | [American Songwriter](https://americansongwriter.com/chance-the-rapper-and-vic-mensas-inaugural-black-star-line-festival-draws-more-than-50000-fans/?nb=1) | 1 | search-snippet | draft |
| Vic Mensa | high | Fact | His Orange Tree video series took home a Webby in the Social Content Series category for Arts, Culture & Lifestyle. | [Essence](https://www.essence.com/entertainment/vic-mensa-webby-awards-dj-set/) | 1 | search-snippet | draft |
| Vic Mensa | high | Article | Vic Mensa to expand his ‘Orange Tree’ thoughts with launch of new podcast, ‘The Vic Mensa Show’ | [theGrio](https://thegrio.com/2026/08/11/vic-mensa-vic-mensa-show-podcast/) | | search-snippet | draft |
| Vic Mensa | high | Article | Review: Vic Mensa always has Chicago on his mind as he brings ‘Innanetape’ tour back home | [Chicago Sun-Times](https://chicago.suntimes.com/music/2026/10/29/review-vic-mensa-innanetape-tour-chicago-show) | | search-snippet | draft |
| Vic Mensa | high | Article | Vic Mensa, Black media empire | [Black Enterprise](https://www.blackenterprise.com/vic-mensa-media-ownership-black-wealth/) | | search-snippet | draft |
| Steve Stoute | high | Fact | Variety named him its Music Mogul of the Year in 2025. | [Variety](https://variety.com/2025/biz/news/skydance-fcc-paramount-steve-stoute-variety-music-mogul-1236469907) | 1 | search-snippet | draft |
| Steve Stoute | high | Fact | Advertising Age crowned him Executive of the Year in 2013, back when he was running his agency Translation. | [Translation via GlobeNewswire (press release)](https://www.globenewswire.com/news-release/2013/01/29/1309353/0/en/Translation-s-Steve-Stoute-Named-Advertising-Age-s-Executive-of-the-Year.html?print=1) | 2 | search-snippet | draft |
| Steve Stoute | high | Podcast | LISTEN: Skydance Media Offers Olive Branches to FCC; Why Steve Stoute is Variety’s Music Mogul of the Year | [Variety](https://variety.com/2025/biz/news/skydance-fcc-paramount-steve-stoute-variety-music-mogul-1236469907) | | search-snippet | draft |
| Steve Stoute | high | Podcast | Steve Stoute on UnitedMasters, a New Deal with Apple Music, Ownership in Hip-Hop, and Why Brands Value Indie Artists | [Trapital](https://trapital.co/steve-stoute-on-unitedmasters-a-new-deal-with-apple-music-ownership-in-hip-hop-and-why-brands-value-indie-artists/) | | search-snippet | draft |
| Steve Stoute | high | Article | Steve Stoute UnitedMasters interview | [Complex](https://www.complex.com/music/a/j-rose/steve-stoute-unitedmasters-interview) | | search-snippet | draft |
| Chris Lyons | high | Fact | Before venture capital, he started out as a music producer working with Jermaine Dupri of Atlanta's So So Def Records. | [Design Better podcast](https://designbetterpodcast.com/p/christopher-lyons) | 1 | search-snippet | draft |
| Chris Lyons | high | Fact | He advises the James Beard Foundation and Yuga Labs, bringing food and Web3 into his portfolio of causes. | [Andreessen Horowitz](https://a16z.com/author/chris-lyons/) | 2 | search-snippet | draft |
| Chris Lyons | high | Podcast | Christopher Lyons: From producing music to venture capital, and why EQ beats IQ in building the future | [Design Better](https://designbetterpodcast.com/p/christopher-lyons) | | search-snippet | draft |
| Chris Lyons | high | Website | https://chrislyons.substack.com/p/coming-soon | [site](https://chrislyons.substack.com/p/coming-soon) | 3 | search-snippet | draft |
| Gregory Green | medium | Fact | Spring's A Bootiful Podcast billed him as a "data guru" in an August 2026 episode spanning GemFire, RabbitMQ Streams and vector search. | [Spring (spring.io blog)](https://spring.io/blog/2026/08/06/a-bootiful-podcast-gregory-green/) | 2 | page | draft |
| Gregory Green | medium | Podcast | A Bootiful Podcast: Data guru Gregory Green on RabbitMQ, Valkey, Gemfire, Data Flow, and more | [Spring (spring.io blog)](https://spring.io/blog/2026/08/06/a-bootiful-podcast-gregory-green/) | | page | draft |
| Gregory Green | medium | Podcast | Cloud Foundry Weekly: Data Services: Gemfire, MySQL, Postgres & Rabbit, Oh My! : Episode 14 | [Cloud Foundry Weekly (via Player FM)](https://de.player.fm/1Bhlewl) | | search-snippet | draft |
| Rani Johnson | high | Fact | As a NASA intern she was on a team whose code was deployed on the International Space Station. | [Workday](https://www.workday.com/en-us/company/about-workday/leadership/rani-johnson.html) | 2 | search-snippet | draft |
| Rani Johnson | high | Article | Workday Names Rani Johnson Chief Information Officer | [Workday Newsroom](https://newsroom.workday.com/2023-03-20-Workday-Names-Rani-Johnson-Chief-Information-Officer) | | search-snippet | draft |
| Michelle Grover | high | Fact | Before becoming Slalom's first CTO, she was the CIO at Twilio, the cloud communications company. | [GeekWire](https://www.geekwire.com/2022/tech-moves-ex-twilio-cio-named-cto-at-slalom-eviation-adds-ceo-docugami-builds-team/) | 1 | search-snippet | draft |
| Michelle Grover | high | Article | Tech Moves: Ex-Twilio CIO named CTO at Slalom; Eviation adds CEO; Docugami builds team | [GeekWire](https://www.geekwire.com/2022/tech-moves-ex-twilio-cio-named-cto-at-slalom-eviation-adds-ceo-docugami-builds-team/) | | search-snippet | draft |
| Michelle Grover | high | Article | Slalom welcomes IT and Engineering leader Michelle Grover as its first Chief Technology Officer | [Global Security Mag](https://www.globalsecuritymag.fr/Slalom-welcomes-IT-and-Engineering,20220920,130069.html) | | search-snippet | draft |

**Nothing published-worthy found:**

- Jonathan Yeldell (low): Three searches (name alone, name + AWS, surname + AWS solutions architect) returned nothing about him; results were other Jonathans at AWS. Expected for an individual-contributor engineer; leave empty and rely on the official bio and LinkedIn.
- Olukunle Owolabi (low): Four searches (name + Meta/AI/ML, and the 'Dipo Owolabi' variant suggested by the LinkedIn slug) returned only other people with the surname Owolabi or generic Meta job pages; none were used. Nothing to publish beyond the official bio.
- Nicole Murray (low): Three searches (NVIDIA DGX Cloud, AWS solutions architect, re:Invent/blog) returned only job postings and other people (e.g. a Sean Murray at AWS, a Nicole Foster at AWS); none used. Common name, so no facts recorded.
