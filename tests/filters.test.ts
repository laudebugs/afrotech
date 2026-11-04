// Plan 0009, todo 038: the shared filters. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NO_FILTERS, accessOf, activeCount, matches, readFilters, writeFilters,
  type FilterContext, type FilterEvent, type Filters,
} from "../src/lib/filters.ts";

const ev = (id: string, start: string | null, extra: Partial<FilterEvent> = {}): FilterEvent => ({
  id, date: (start ?? "2026-11-04").slice(0, 10), start, end: null, kind: "side", track: null, cats: [],
  free: false, access: null, where: "city", pick: false, ...extra,
});
const ctx = (extra: Partial<FilterContext> = {}): FilterContext => ({
  now: Date.parse("2026-11-04T14:00:00-06:00"), today: "2026-11-04", planned: new Set(), plannedSpans: [], ...extra,
});
const keep = (events: FilterEvent[], f: Partial<Filters>, c = ctx()) =>
  events.filter((e) => matches(e, { ...NO_FILTERS, ...f }, c)).map((e) => e.id);

const morning = ev("m", "2026-11-04T09:00:00-06:00");
const live = ev("l", "2026-11-04T13:30:00-06:00", { end: "2026-11-04T15:00:00-06:00" });
const soon = ev("s", "2026-11-04T14:45:00-06:00");
const evening = ev("e", "2026-11-04T19:00:00-06:00", { free: true, cats: ["Party"] });
const late = ev("x", "2026-11-04T23:00:00-06:00");
const tomorrow = ev("t", "2026-11-05T10:00:00-06:00", { kind: "official", track: "Wealth", where: "grb" });
const all = [morning, live, soon, evening, late, tomorrow];

test("no filters keep everything", () => {
  assert.deepEqual(keep(all, {}), ["m", "l", "s", "e", "x", "t"]);
});

test("when: now and next hour, today, tonight", () => {
  assert.deepEqual(keep(all, { when: "now" }), ["l", "s"]);
  assert.deepEqual(keep(all, { when: "today" }), ["m", "l", "s", "e", "x"]);
  assert.deepEqual(keep(all, { when: "tonight" }), ["e", "x"]);
});

test("a day and a time of day", () => {
  assert.deepEqual(keep(all, { day: "2026-11-05" }), ["t"]);
  assert.deepEqual(keep(all, { time: "morning" }), ["m", "t"]);
  assert.deepEqual(keep(all, { time: "afternoon" }), ["l", "s"]);
  assert.deepEqual(keep(all, { time: "evening" }), ["e"]);
  assert.deepEqual(keep(all, { time: "late" }), ["x"]);
});

test("type, track, kind, free, where and picks", () => {
  assert.deepEqual(keep(all, { kind: "official" }), ["t"]);
  assert.deepEqual(keep(all, { track: "Wealth" }), ["t"]);
  assert.deepEqual(keep(all, { cat: "Party" }), ["e"]);
  assert.deepEqual(keep(all, { free: true }), ["e"]);
  assert.deepEqual(keep(all, { where: "grb" }), ["t"]);
  assert.deepEqual(keep([...all, ev("p", null, { pick: true })], { picks: true }), ["p"]);
});

test("access: official needs a badge; invite-style notes need an RSVP", () => {
  assert.equal(accessOf(tomorrow), "badge");
  assert.equal(accessOf(ev("a", null, { access: "Badge" })), "badge");
  assert.equal(accessOf(ev("b", null, { access: "Invite only · Sold out (waitlist)" })), "rsvp");
  assert.equal(accessOf(ev("c", null, { access: "Open" })), "open");
  assert.equal(accessOf(ev("d", null)), "open");
});

test("in my plan, and doesn't clash with it", () => {
  const c = ctx({
    planned: new Set(["l"]),
    plannedSpans: [{ id: "l", start: Date.parse(live.start!), end: Date.parse(live.end!) }],
  });
  assert.deepEqual(keep(all, { plan: true }, c), ["l"]);
  // "s" starts at 2:45, inside the planned 1:30–3:00; "l" is the planned event itself.
  assert.deepEqual(keep(all, { noclash: true }, c), ["m", "l", "e", "x", "t"]);
});

test("filters round-trip through the address, ignoring junk", () => {
  const f: Filters = { ...NO_FILTERS, when: "tonight", free: true, track: "AI & ML", where: "near" };
  const params = writeFilters(new URLSearchParams("q=jazz&free=0"), f);
  assert.equal(params.get("q"), "jazz");
  assert.deepEqual(readFilters(params), f);
  assert.deepEqual(readFilters(new URLSearchParams("when=soon&day=nov4&where=moon&free=yes")), NO_FILTERS);
  assert.equal(activeCount(f), 4);
});
