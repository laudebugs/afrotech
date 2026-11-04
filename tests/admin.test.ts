import { test } from "node:test";
import assert from "node:assert/strict";
import { chartRange, fillDays, formatBytes, houstonDate, shortDay } from "../src/lib/admin.ts";

// Wed, Nov 4, 2026, 1:00 AM in Houston (07:00 UTC).
const NOW = Date.parse("2026-11-04T07:00:00Z");

test("houstonDate counts days in Houston time", () => {
  assert.equal(houstonDate(NOW), "2026-11-04");
  assert.equal(houstonDate(Date.parse("2026-11-04T05:00:00Z")), "2026-11-03"); // 11 PM Nov 3 in Houston
  assert.equal(houstonDate(NOW, 3), "2026-11-01");
});

test("fillDays fills gaps with zero and drops days outside the range", () => {
  const out = fillDays(
    [
      { day: "2026-11-02", n: 3 },
      { day: "2026-11-04", n: 1 },
      { day: "2027-01-01", n: 9 },
    ],
    "2026-11-01",
    "2026-11-04",
  );
  assert.deepEqual(out, [
    { day: "2026-11-01", n: 0 },
    { day: "2026-11-02", n: 3 },
    { day: "2026-11-03", n: 0 },
    { day: "2026-11-04", n: 1 },
  ]);
});

test("chartRange covers at least a week and at most 14 days", () => {
  assert.deepEqual(chartRange([[{ day: "2026-11-03", n: 2 }]], NOW), { from: "2026-10-29", to: "2026-11-04" });
  assert.deepEqual(chartRange([[{ day: "2026-10-25", n: 2 }]], NOW), { from: "2026-10-25", to: "2026-11-04" });
  assert.deepEqual(chartRange([[{ day: "2026-01-01", n: 2 }]], NOW), { from: "2026-10-29", to: "2026-11-04" });
  assert.deepEqual(chartRange([], NOW), { from: "2026-10-29", to: "2026-11-04" });
});

test("formatBytes and shortDay", () => {
  assert.equal(formatBytes(12), "12 B");
  assert.equal(formatBytes(820_400), "820 KB");
  assert.equal(formatBytes(1_400_000), "1.4 MB");
  assert.equal(shortDay("2026-11-04"), "Wed 4");
});
