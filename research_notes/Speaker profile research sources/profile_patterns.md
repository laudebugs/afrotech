# Speaker profile patterns on event platforms and conference sites

**Method and caveat.** This session's network allowlist blocked direct page fetches: sessionize.com, learn.sessionboard.com and whova.com all failed DNS resolution. So every finding below comes from web-search result summaries, not full pages I read myself. Treat the specifics, especially exact numbers, as "reported by the search index for that URL". Check anything load-bearing against the live page before relying on it. Where a source is secondary (a scraper listing, a mailing list, a third-party plugin doc), I say so.

## 1. What fields and layout do platforms and major conferences show on speaker profiles (links, handles, sessions, photos)?

### Takeaway
The cross-platform core is the same everywhere: photo, name, a one-line tagline (or job title plus company), a bio, an array of links, and the speaker's sessions. Sessionize and Whova add organizer-defined custom questions on top. I couldn't verify layouts for AfroTech's own site, SXSW, Google I/O, re:Invent, TED, Bizzabo, Hopin/RingCentral or Eventbrite in this session.

### Cited Findings
- **Sessionize, profile:** the speaker's Edit Profile page has a "Tagline & Bio" tab (a professional tagline plus a biography) and supports multiple language versions. The speaker picks which version appears on their public profile. — [Sessionize: Speaker dashboard](https://sessionize.com/playbook/speaker-dashboard)
- **Sessionize, submission fields:** speaker name, email, tagline and biography are predefined fields for submissions. — [Sessionize: Fields explained](https://sessionize.com/playbook/fields-explained)
- **Sessionize, API speaker object:** includes `bio`, `tagLine`, `profilePicture` (a URL string), `links` (an array), `questionAnswers` (an array of answers to organizer custom questions), `isTopSpeaker` (a boolean) and the speaker's sessions. — [Microsoft Learn: Sessionize connector](https://learn.microsoft.com/en-us/connectors/sessionizeip/); [mcp-sessionize README](https://github.com/jeanlopezxyz/mcp-sessionize) (secondary; it also gives the public API pattern `https://sessionize.com/api/v2/{EVENT_ID}/view/All`)
- **Sessionize, question-answer shape:** each `questionAnswers` item has `id`, `question`, `questionType`, `answer` and `sort`. Some client libraries don't map this field. — [xdev-software/sessionize-java-client issue #61](https://github.com/xdev-software/sessionize-java-client/issues/61) (secondary)
- **Whova:** speakers fill in a personal form where they submit a bio, upload a photo, provide handouts, write session descriptions and list discussion topics. — [Whova speaker management](https://whova.com/speaker-management-software/)
- **Whova, custom fields:** organizers can add up to five custom fields to the speaker form and set each one to public (shown on the profile) or internal. — [Whova blog: speaker form custom fields](https://whova.com/blog/speaker-form-custom-fields/)
- **Swapcard:** profiles have a biography field capped at 1,000 characters. Social accounts are entered as usernames, not full URLs, and each one renders as a network logo on the profile. Email, phone and social links stay private until the viewer connects or the user accepts a meeting. — [Swapcard: what information in my profile is accessible](https://help-attendees.swapcard.com/en/articles/8185450-what-information-in-my-profile-is-accessible-by-other-participants); [Swapcard: manage your profile](https://help-attendees.swapcard.com/en/articles/8185446-manage-your-profile-dashboard)
- **Swapcard, speaker data:** speaker bios can come in from an external session tool such as Lineup Ninja, and organizers can translate bios and job titles. — [Lineup Ninja: Swapcard integration](https://docs.lineup.ninja/agenda/integrate/swapcard/)
- **Luma, host profile:** third-party scrapers report a name, avatar, public bio, website and social handles (X, LinkedIn, Instagram, YouTube, TikTok), plus a "verified" flag. Many hosts leave the social fields empty. — [Apify: Luma scraper (logiover)](https://apify.com/logiover/luma-scraper); [Apify: Luma events (maximedupre)](https://apify.com/maximedupre/luma-events) (secondary; neither is official Luma documentation)
- **Sessionboard:** markets reusing a returning speaker's "bio, headshot, and session history" across events. Its template advises collecting the bio at each length you'll publish, and a headshot of 1200 px or more. — [Sessionboard: speaker management](https://www.sessionboard.com/feature/speaker-management); [Sessionboard: speaker bio template](https://www.sessionboard.com/templates/speaker-bio-template)
- **AfroTech 2026, scale:** AfroTech's own pages describe 300+ speakers, 15 tracks and 11 stages at the George R. Brown Convention Center. — [AfroTech: 2026 speakers first announced](https://afrotech.com/afrotech-conference-2026-speakers-first-announced)
- **AfroTech 2026, Authors Pavilion:** the line-up (Stacey Abrams, Roy Wood Jr., Denise Young Smith, Tareasa "Reesa Teesa" Johnson) was published as an editorial article, not as structured profiles. — [AfroTech: Authors Pavilion lineup](https://afrotech.com/afrotech-2026-authors-pavilion-full-schedule-and-lineup-featuring-stacey-abrams-reesa-teesa-and-more)
- **Luminik's AfroTech speaker list:** a third-party aggregator listed only 18 AfroTech speakers, as of 2026-09-17. — [Luminik](https://www.luminik.io/events/afrotech-conference-houston-87a40c27f5a4/) (incomplete; don't use it as a data source)

### Inferences
- A data model that matches Sessionize's (tagline, bio, profilePicture, links[], questionAnswers[], sessions[]) would map cleanly onto most platforms. For this site, "in brief" plays the role of the tagline or short bio.
- Swapcard's username-plus-icon pattern for social links is compact on mobile. Rendering full, visible links with text labels ("LinkedIn", "X", "Website") is more accessible than icon-only links.
- The AfroTech Authors Pavilion article shows that the official site presents some speakers as prose lists. That makes a structured community profile page useful in its own right.

### Gaps
- I couldn't verify the layouts of afrotechconference.com/speakers, SXSW, Web Summit, Google I/O, AWS re:Invent, TED, Bizzabo, Eventbrite or RingCentral Events (Hopin): search returned no layout descriptions, and fetches were blocked.

## 2. How do platforms keep bios short? Short vs long bio fields, character limits, Sessionize guidance

### Takeaway
The common split is a one-line tagline or short bio (40–60 words, or about 155 characters for a description) plus a long bio (roughly 100–160 words). Hard caps vary by platform; Swapcard's is 1,000 characters. I found no published Sessionize length limit. It appears to be left to each event's form.

### Cited Findings
- **Eventbrite:** short-form bios run 2–3 sentences (40–60 words); long-form bios run roughly 60–160 words. Use the short bio in most places and the longer one on the event website. — [Eventbrite blog: speaker bio](https://www.eventbrite.com/blog/speaker-bio-ds00/)
- **Dryfta:** suggests 80–120 words as an ideal conference bio, and says a medium bio of about 100 words is the most commonly requested length. — [Dryfta: How to write a conference speaker bio](https://dryfta.com/how-to-write-a-conference-speaker-bio-with-examples/)
- **Sessionboard:** advises collecting the bio at the lengths you will publish. — [Sessionboard: speaker bio template](https://www.sessionboard.com/templates/speaker-bio-template)
- **Swapcard:** caps biographies at 1,000 characters. — [Swapcard help](https://help-attendees.swapcard.com/en/articles/8185450-what-information-in-my-profile-is-accessible-by-other-participants)
- **Drexel's event guide:** caps descriptions at 155 characters, the snippet length. — [Drexel LeBow: creating and adding speakers](https://www.lebow.drexel.edu/resources/technology/knowledge-base/creating-and-adding-speaker-your-event)
- **Sessionize:** separates `tagLine` (short) from `bio` (long). Search found no character limit. — [Microsoft Learn: Sessionize connector](https://learn.microsoft.com/en-us/connectors/sessionizeip/)

### Inferences
- A reasonable house rule for this site: "in brief" at 1–2 sentences (no more than about 160 characters, so it can double as the meta description and the directory card text), with the full bio collapsed behind a "Read full bio" `<details>` element on mobile.
- Store the speaker's own bio verbatim and attribute it ("Bio from AfroTech / Sessionize"). Keep the editorial "in brief" separate and clearly ours.

### Gaps
- No Sessionize-specific bio length guidance turned up. Its playbook pages couldn't be fetched to confirm.

## 3. How are fun facts and personal touches presented, and are they speaker-provided or editorial?

### Takeaway
On the platforms I could verify, personal touches are speaker-provided answers to organizer-defined custom questions (Sessionize `questionAnswers`, Whova's custom fields). I found no evidence of platforms publishing editorial, third-party-sourced fun facts. Doing that would be a departure, and it needs clear sourcing and labeling.

### Cited Findings
- **Sessionize:** organizer custom questions come back per speaker as `questionAnswers` (question, type, answer, sort order). — [xdev-software issue #61](https://github.com/xdev-software/sessionize-java-client/issues/61); [Microsoft Learn: Sessionize connector](https://learn.microsoft.com/en-us/connectors/sessionizeip/)
- **Whova:** up to five custom fields, each set to attendee-visible or internal. — [Whova blog](https://whova.com/blog/speaker-form-custom-fields/)
- **Swapcard:** organizers can lock basic fields; by default every field except email can be edited by the profile owner. Speakers own their content. — [Swapcard help](https://help-attendees.swapcard.com/en/articles/8185446-manage-your-profile-dashboard)

### Inferences
- Present each fun fact as a short line with an inline source link ("Co-founded X in 2019 — [source]"), dated where it matters, and label the section as compiled by the community, not by the speaker.
- Use only public, professional facts. Avoid family, health or other personal details, and anything that could identify where the speaker lives. That fits the repo rule to keep personal contact details off the site.

### Gaps
- I couldn't confirm the structure of TED's "about the speaker" pages or any platform's built-in "fun fact" prompt. Search returned only TED index pages.

## 4. Image accessibility and performance; SEO and structured data

### Takeaway
Use name-based alt text, or empty alt when the name sits right next to the photo. Load small, fixed-size images: eager plus high priority for the profile header photo, lazy for directory thumbnails. Mark sessions up as schema.org `Event` with `performer` → `Person`. Schema.org Event has no `speaker` property.

### Cited Findings
- **Alt text, community views:** WAI Interest Group discussion found no single answer. One view is "Photo of [name]" (the W3C People directory pattern), with no physical description. Another is empty alt when the visible name sits right beside the photo. — [W3C WAI-IG thread: headshot images](https://lists.w3.org/Archives/Public/w3c-wai-ig/2022JulSep/0083.html); [W3C bug 23059](https://www.w3.org/Bugs/Public/show_bug.cgi?id=23059) (mailing list and bug tracker, not normative guidance)
- **Lazy loading:** `loading="lazy"` defers offscreen images natively; `fetchpriority="high"` boosts the LCP image. An image with both is still deferred, so don't combine them. — [web.dev: Browser-level image lazy loading](https://web.dev/browser-level-image-lazy-loading)
- **Responsive images:** `srcset` lists candidate files with their intrinsic widths; `sizes` describes the rendered width at each breakpoint. — [web.dev: Browser-level image lazy loading](https://web.dev/browser-level-image-lazy-loading) (via search summary)
- **schema.org `performer`:** accepts Person or Organization ("a presenter, musician…"); `performerIn` on Person points back to the Event. — [schema.org/Event](https://schema.org/Event); [schema.org performerIn](https://auto.schema.org/performerIn)
- **Linking nodes:** Yoast's implementation references Person nodes from `performer` by `@id`, so each person is defined once. — [Yoast: Event schema piece](https://developer.yoast.com/features/schema/pieces/event)
- **Google event rich results:** require name, location and an ISO-8601 startDate. `performer` is reportedly a recommended property, and each event needs its own URL. — [Google Search Central: Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event?hl=de); [Joomla issue 47990](https://issues.joomla.org/tracker/joomla-cms/47990) (secondary on "recommended")

### Inferences
- On the speaker page, emit a JSON-LD `Person` (name, jobTitle, worksFor → Organization, image, url, `sameAs` → LinkedIn/X/website). Each session page's `Event` references it via `performer: {"@id": ".../speakers/slug#person"}`. Times use Houston `-06:00` offsets.
- **Images:** pre-size at build time (for example 96 px and 192 px squares for 1x/2x, WebP or AVIF with a JPEG fallback), and set explicit `width`/`height` to avoid layout shift. Give the header photo `fetchpriority="high"` (not lazy) and directory thumbnails `loading="lazy" decoding="async"`. When there's no photo, show initials on a token-colored circle instead of a remote placeholder.
- Self-host speaker photos so the page doesn't depend on a third-party CDN over bad Wi-Fi, but only where reuse rights are clear (see Section 6).

### Gaps
- I didn't fetch the normative WAI images tutorial or Google's English Event page text. Google doesn't document "Person" rich results for speaker pages.

## 5. Speaker directory UX: search, filters, sorting

### Takeaway
Typical directories offer alphabetical sorting (A–Z and Z–A), a category or track filter and text search, with cards showing name, role and employer, plus pagination for large lists. I found no source confirming a company filter.

### Cited Findings
- **BrandLive:** its People section offers sorting by Name (A–Z / Z–A) and a category filter. — [BrandLive: People Section](https://support.brandlive.com/hc/en-us/articles/40620893242779-People-Section)
- **Rosenverse:** its speaker directory pages through 1,048 speakers, 60 per page, and each card shows role and employer. — [Rosenverse speakers](https://rosenverse.rosenfeldmedia.com/people/speakers?page=1)
- **Speaker bureaus:** WICT and CNCF filter by expertise, location, language and format. — [WICT speaker directory guide](https://wict.org/speaker-directory-user-guide/); [CNCF speakers bureau](https://www.cncf.io/blog/2020/01/31/cncf-speakers-bureau-a-great-resource/)
- **Sched:** schedules filter by venue and session type, which is the closest analogue to track filtering. — [UXPA Boston 2024 on Sched](https://uxpabostonconference2024.sched.com/venue/Independence)
- **Blackbaud:** users asked for its session catalog to show speakers inline, as another conference's catalog did, so linking sessions and speakers in both directions is a felt need. — [Blackbaud community thread](https://community.blackbaud.com/discussion/comment/315368/)
- **Whova:** its admin view can filter "speakers with incomplete profiles" (missing photo, bio, affiliation or title). — [Whova speaker management](https://whova.com/speaker-management-software/)

### Inferences
- With roughly 300 speakers, the whole directory fits in one static page. Client-side text search over name, company and title, an A–Z jump bar and a track filter (derived from each speaker's sessions) avoid server calls and work offline once loaded.
- Whova's "incomplete profile" check is worth copying as a build-time report: list speakers missing a photo, bio or sources.

### Gaps
- I couldn't verify the directory controls at Web Summit, re:Invent, Google I/O or SXSW.

## 6. Correction and consent flows

### Takeaway
On every platform I checked, speakers own and edit their own profile. Organizers control edit windows and can lock fields, and changes don't always propagate. A community site with no speaker accounts needs a visible "Request a correction" path and a takedown promise instead.

### Cited Findings
- **Sessionize, per-event bios:** tagline and bio are event-specific. Editing the default profile doesn't update events already submitted to. — [Sessionize: ways of editing sessions and speakers](https://sessionize.com/playbook/ways-of-editing-sessions-speakers)
- **Sessionize, edit windows:** organizers decide whether, and for how long, speakers can edit after submitting. Session history logs changes by both sides. — [Sessionize: allowing speakers to edit sessions](https://sessionize.com/playbook/allowing-speakers-to-edit-sessions)
- **Sessionize, roles:** a co-speaker who isn't the session owner can't edit the session but can edit their own speaker details. — [Sessionize: session owner vs session speaker](https://sessionize.com/playbook/session-owner-and-session-speaker)
- **Sessionboard:** organizers can lock specific fields and decide when changes are final. — [Sessionboard blog: speaker experience updates](https://www.sessionboard.com/blog/7-new-updates-to-enhance-the-speaker-experience-save-time-and-improve-speaker-management)
- **Swapcard:** profile owners can edit every field except email unless the organizer locks it. Contact and social details stay hidden until a connection is made. — [Swapcard help](https://help-attendees.swapcard.com/en/articles/8185446-manage-your-profile-dashboard)
- **Zuddl:** documents "what changes where" for speaker profile data, which shows that sync between profile and event copies is a known source of confusion. — [Zuddl: speaker profile data](https://support.zuddl.com/articles/5300278440-speaker-profile-data-what-changes-where)

### Inferences
- **Correction flow:** put a "Something wrong? Suggest a correction" link on every speaker page. It can open a prefilled GitHub issue, fitting the site's no-sign-in, GitHub-publishing model. Show a "Last checked" date, and promise to remove a profile or fact on the speaker's request.
- **Content rules:** keep editorial fields (in brief, fun facts, articles) separate from speaker-supplied fields (bio, photo, links), so a correction touches only our layer. Don't show emails or phone numbers, matching Swapcard's privacy default and the repo rule.

### Gaps
- I found no documentation on how community, non-organizer sites handle speaker consent. Nor could I verify Whova's own help-center steps for speakers editing their bio.
