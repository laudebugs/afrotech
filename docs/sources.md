# Sources

Everything the site's data comes from, and how to refresh it.

## Event data

| Source | What it has | How we pull it | Refresh |
|--------|-------------|----------------|---------|
| [AfroTech official schedule](https://afrotechconference.com/schedule) | 259 official sessions: time, room, track, speakers, ticket levels | `scripts/update_schedule.py` reads the page's Nuxt payload (`/schedule/_payload.json`) | Automatic |
| [afrotech.guide](https://afrotech.guide/) (Keith Azodeh, with Blavity) | ~114 community side events with RSVP links, venues, addresses | `scripts/update_side_events.py` calls the public `GET /api/events` endpoint | Automatic |
| [AfroTech 2026 community sheet](https://docs.google.com/spreadsheets/d/1PLDLOdFCuwDAy4fe5y09hb4KgYlX3bsgX60U2z2KE_0/edit) (Keith Azodeh) | 146 side events; overlaps with afrotech.guide, adds ~35 more | Same script, via the sheet's `gviz/tq?tqx=out:csv` export (the CSV drops hyperlinks) | Automatic |
| [Adaptive Foundation side-events guide](https://1drv.ms/x/c/201780541da98428/IQAwneocjcw7RLgXigZPaCX-Afj6iRzSioL8HrnOZ6uMc-Y) (Lyncy Nyandoche) | 76 side events with links, access type, and a Founder & Investor shortlist | OneDrive blocks automated downloads, so it's exported by hand to `data/sources/adaptive-foundation-side-events.csv` | Manual (current as of Oct 16, 2026) |

Merged output: `data/sessions.json`, `data/sessions.csv`, `data/side-events.csv`.

## Venue and map data

| Source | Use |
|--------|-----|
| [GRB floor plans](https://grbhouston.com/planners/floor-plans) | Reference PDFs (exhibit halls A–E, Level 2, meeting rooms, ballroom) for tracing our own simplified SVG |
| [GRB dimensions & capacities](https://www.grbhouston.com/planners/dimensions-capacities/) | Room sizes, to keep the traced plan in proportion |
| [OpenStreetMap](https://www.openstreetmap.org/) | Building footprint of the GRB and the Marriott Marquis, for placing the floor plan at real-world coordinates |
| [OpenFreeMap](https://openfreemap.org/) | Free vector map tiles (no API key) for the city map of side events |
| [Nominatim](https://nominatim.org/) | One-off geocoding of side-event addresses at build time (max 1 request/second, results cached in the repo) |

## Other references

- [AfroTech speakers](https://afrotechconference.com/speakers)
- [AfroTech Authors Pavilion lineup](https://afrotech.com/afrotech-2026-authors-pavilion-full-schedule-and-lineup-featuring-stacey-abrams-reesa-teesa-and-more)
- [Visit Houston event listing](https://www.visithoustontexas.com/event/afrotech-2026-conference/116978/)

## Ground rules

- Credit each community list on the site, with a link back. They did the work.
- Don't republish the GRB's floor-plan PDFs. Trace our own simplified plan from them.
- Personal details in sources (organiser emails, etc.) stay out of the site.
