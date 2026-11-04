// Week-wide search (plan 0009). Shared by the build, which writes
// /search-index.json, and the search page, which matches in the browser with
// MiniSearch: prefix matching, small typos forgiven, case and accents ignored,
// every word required.
import MiniSearch, { type SearchResult } from "minisearch";
import { eventEndMs } from "./time.ts";

/** One event, as much as search and the filters need. */
export type SearchEvent = {
  id: string;
  title: string;
  date: string;
  start: string | null;
  end: string | null;
  kind: "official" | "side";
  track: string | null;
  cats: string[];
  price: string | null;
  free: boolean;
  access: string | null;
  place: string;
  host: string | null;
  /** Speakers' names and companies, one string. */
  people: string;
  desc: string;
  pick: boolean;
  /** At the convention center, walkable from it (1.5 km), across Houston, or unknown. */
  where: "grb" | "near" | "city" | null;
};

export type SearchSpeaker = { slug: string; name: string; title: string | null; company: string | null };

export type SearchIndex = { events: SearchEvent[]; speakers: SearchSpeaker[] };

/** Lower case, without accents: "Café" and "cafe" match. */
export const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const options = {
  processTerm: (term: string) => fold(term),
  searchOptions: {
    // Word starts count from 4 letters, so "art" means art, not "artificial",
    // and "ai" means AI, not "aid" or "airport".
    prefix: (term: string) => term.length >= 4,
    // Short words must be exact; longer ones forgive one or two letters.
    fuzzy: (term: string) => (term.length >= 7 ? 0.25 : term.length >= 5 ? 0.2 : false),
    combineWith: "AND" as const,
  },
};

const EVENT_FIELDS = ["title", "people", "host", "place", "track", "cats", "desc"];
const EVENT_BOOST = { title: 4, people: 2.5, host: 2, place: 1.5, track: 1.2, cats: 1.2, desc: 0.6 };

export function eventSearch(events: SearchEvent[]) {
  const ms = new MiniSearch<SearchEvent>({
    ...options,
    fields: EVENT_FIELDS,
    extractField: (doc, field) => {
      const value = (doc as Record<string, unknown>)[field];
      return Array.isArray(value) ? value.join(" ") : ((value as string | null) ?? "");
    },
    searchOptions: { ...options.searchOptions, boost: EVENT_BOOST },
  });
  ms.addAll(events);
  return ms;
}

export function speakerSearch(speakers: SearchSpeaker[]) {
  const ms = new MiniSearch<SearchSpeaker>({
    ...options,
    idField: "slug",
    fields: ["name", "title", "company"],
    extractField: (doc, field) => ((doc as Record<string, unknown>)[field] as string | null) ?? "",
    searchOptions: { ...options.searchOptions, boost: { name: 3 } },
  });
  ms.addAll(speakers);
  return ms;
}

/** 0 when a word matched the title, 1 a speaker or host, 2 anything else. */
function tier(result: SearchResult): number {
  const fields = new Set(Object.values(result.match).flat());
  if (fields.has("title")) return 0;
  if (fields.has("people") || fields.has("host")) return 1;
  return 2;
}

const endMs = (e: SearchEvent) => (e.start ? eventEndMs(e.start, e.end) : Infinity);
const startMs = (e: SearchEvent) => (e.start ? Date.parse(e.start) : Date.parse(`${e.date}T23:59:00-06:00`));

/**
 * Events matching the words, best first: title matches, then speaker and
 * host matches, then the rest; within each, upcoming before ended, then the
 * soonest. With no words, every event in time order.
 */
export function findEvents(
  ms: MiniSearch<SearchEvent>,
  byId: Map<string, SearchEvent>,
  query: string,
  now: number,
): SearchEvent[] {
  const ended = (e: SearchEvent) => (endMs(e) <= now ? 1 : 0);
  // Only punctuation ("&" on the way to "R&B") is no search yet.
  const words = /[\p{L}\p{N}]/u.test(query) ? query.trim() : "";
  if (!words) {
    return [...byId.values()].sort((a, b) => ended(a) - ended(b) || startMs(a) - startMs(b));
  }
  return ms
    .search(words)
    .map((r) => ({ r, e: byId.get(String(r.id))! }))
    .filter((x) => x.e)
    .sort((a, b) => tier(a.r) - tier(b.r) || ended(a.e) - ended(b.e) || startMs(a.e) - startMs(b.e))
    .map((x) => x.e);
}

export function findSpeakers(ms: MiniSearch<SearchSpeaker>, query: string): string[] {
  return /[\p{L}\p{N}]/u.test(query) ? ms.search(query.trim()).map((r) => String(r.id)) : [];
}

/**
 * Where an event is, for the Where filter: at the convention center (official
 * sessions and on-site venues), walkable from it, across Houston, or null
 * when it has no location at all. An off-site place the geocoder couldn't pin
 * still counts as across Houston, so the filter never hides it.
 */
export function placeOf(
  kind: SearchEvent["kind"],
  venueKind: string | undefined,
  hasLocation: boolean,
  metresFromCenter: number | null,
  walkable: number,
): SearchEvent["where"] {
  if (kind === "official" || (venueKind && ["grb", "marriott", "outdoor"].includes(venueKind))) return "grb";
  if (metresFromCenter !== null) return metresFromCenter <= walkable ? "near" : "city";
  return hasLocation ? "city" : null;
}

/** A note as search sees it: the text without Markdown or embedded images. */
export type SearchNote = { id: string; title: string; text: string };

/** Note Markdown as plain words: images, links' targets and symbols removed. */
export function noteText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images, which may be large data: URLs
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep their text
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function noteSearch(notes: SearchNote[]) {
  const ms = new MiniSearch<SearchNote>({
    ...options,
    fields: ["title", "text"],
    searchOptions: { ...options.searchOptions, boost: { title: 3 } },
  });
  ms.addAll(notes);
  return ms;
}

export function findNotes(ms: MiniSearch<SearchNote>, query: string): string[] {
  return /[\p{L}\p{N}]/u.test(query) ? ms.search(query.trim()).map((r) => String(r.id)) : [];
}
