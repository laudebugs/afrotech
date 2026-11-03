// iCalendar (.ics) files for one event or a whole plan. Pure functions, so the
// event pages (build time) and My plan (browser) share them.
import type { ScheduleEvent } from "./types";

const SITE = "https://afrotech26.laudebugs.me";

/** 20261104T190000Z */
function utcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape text values per RFC 5545. */
function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 octets, as RFC 5545 requires. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const n = new TextEncoder().encode(char).length;
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += n;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function vevent(event: ScheduleEvent, now: string): string[] {
  if (!event.start) return [];
  // Events without an end get an hour, so calendars show a block.
  const end = event.end ?? new Date(new Date(event.start).getTime() + 3600_000).toISOString();
  const place = [event.locationLabel, event.address].filter(Boolean).join(", ");
  const url = event.rsvpUrl ?? `${SITE}/event/${event.id}/`;
  const description = [event.description, event.rsvpUrl ? `RSVP: ${event.rsvpUrl}` : null, `${SITE}/event/${event.id}/`]
    .filter(Boolean)
    .join("\n\n");
  return [
    "BEGIN:VEVENT",
    `UID:${event.id}@afrotech26.laudebugs.me`,
    `DTSTAMP:${now}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    place ? `LOCATION:${escapeText(place)}` : "",
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    "END:VEVENT",
  ].filter(Boolean);
}

export function toIcs(events: ScheduleEvent[], name = "AfroTech 2026"): string {
  const now = utcStamp(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//afrotech26.laudebugs.me//AfroTech 2026 Planner//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(name)}`,
    ...events.flatMap((e) => vevent(e, now)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
