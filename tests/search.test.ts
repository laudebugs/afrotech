// Plan 0009: week-wide search matching. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { eventSearch, findEvents, findSpeakers, fold, speakerSearch, type SearchEvent } from "../src/lib/search.ts";

const base: Omit<SearchEvent, "id" | "title" | "start"> = {
  date: "2026-11-04", end: null, kind: "official", track: null, cats: [], price: null, free: false,
  access: null, place: "Room 320", host: null, people: "", desc: "", pick: false, where: "grb",
};
const ev = (id: string, title: string, start: string, extra: Partial<SearchEvent> = {}): SearchEvent => ({
  ...base, id, title, start, ...extra,
});

const events = [
  ev("a", "The Future of AI at Work", "2026-11-04T10:30:00-06:00"),
  ev("b", "Founders Breakfast", "2026-11-04T08:00:00-06:00", { people: "Ada Lovelace Google", desc: "Talk on AI tools" }),
  ev("c", "Entrepreneurship in Houston", "2026-11-05T09:00:00-06:00", { kind: "side", place: "Café Brasil · 2604 Dunlavy" }),
  ev("d", "AI Health Summit", "2026-11-03T09:00:00-06:00", { end: "2026-11-03T10:00:00-06:00" }),
  ev("e", "Health Equity Panel", "2026-11-05T14:00:00-06:00", { desc: "Using AI in clinics" }),
];
const byId = new Map(events.map((e) => [e.id, e]));
const ms = eventSearch(events);
const NOW = Date.parse("2026-11-04T07:00:00-06:00");
const ids = (q: string) => findEvents(ms, byId, q, NOW).map((e) => e.id);

test("fold ignores case and accents", () => {
  assert.equal(fold("Café ÉLAN"), "cafe elan");
});

test("word starts match", () => {
  assert.deepEqual(ids("entre"), ["c"]);
});

test("small typos are forgiven in longer words", () => {
  assert.deepEqual(ids("enterpreneurship"), ["c"]);
  assert.deepEqual(ids("brekfast"), ["b"]);
});

test("accents in the data or the query don't matter", () => {
  assert.deepEqual(ids("cafe"), ["c"]);
  assert.deepEqual(ids("Cafè"), ["c"]);
});

test("every word must match", () => {
  assert.deepEqual(ids("ai health").sort(), ["d", "e"]);
  assert.deepEqual(ids("ai houston"), []);
});

test("title matches rank above speaker and description matches; ended events sink", () => {
  // a: AI in the title (upcoming); d: AI in the title but already over; b: AI only in the description;
  // e: AI only in the description, later.
  assert.deepEqual(ids("ai"), ["a", "d", "b", "e"]);
});

test("speakers and their companies are searchable", () => {
  assert.deepEqual(ids("lovelace"), ["b"]);
  assert.deepEqual(ids("google"), ["b"]);
});

test("no words lists everything, upcoming first in time order", () => {
  assert.deepEqual(ids("  "), ["b", "a", "c", "e", "d"]);
});

test("speaker search by name, company and typo", () => {
  const sms = speakerSearch([
    { slug: "ada-lovelace", name: "Ada Lovelace", title: "Engineer", company: "Google" },
    { slug: "grace-hopper", name: "Grace Hopper", title: "Admiral", company: "US Navy" },
  ]);
  assert.deepEqual(findSpeakers(sms, "lovelac"), ["ada-lovelace"]);
  assert.deepEqual(findSpeakers(sms, "navy"), ["grace-hopper"]);
  assert.deepEqual(findSpeakers(sms, "hoper"), ["grace-hopper"]);
  assert.deepEqual(findSpeakers(sms, ""), []);
});
