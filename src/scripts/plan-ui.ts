// Keeps every star, card and the tab badge in step with My plan, and marks
// clashes between planned events on the page. Loaded on every page.
import { readPlan, togglePlan, watchOtherTabs } from "../lib/plan";
import { eventEndMs, formatTime } from "../lib/time";

const announcer = () => document.querySelector<HTMLElement>("[data-announce]");

function announce(message: string) {
  const el = announcer();
  if (!el) return;
  el.textContent = "";
  // A fresh text node makes screen readers repeat identical messages.
  requestAnimationFrame(() => (el.textContent = message));
}

/** Sets stars, cards, rows and the badge from the stored plan. */
export function syncPlan(root: ParentNode = document) {
  const ids = new Set(readPlan());
  root.querySelectorAll<HTMLButtonElement>("[data-star]").forEach((star) => {
    star.setAttribute("aria-pressed", String(ids.has(star.dataset.star!)));
  });
  root.querySelectorAll<HTMLElement>("[data-event-id]").forEach((el) => {
    if (ids.has(el.dataset.eventId!)) el.dataset.inPlan = "true";
    else delete el.dataset.inPlan;
  });
  document.querySelectorAll<HTMLElement>("[data-plan-count]").forEach((badge) => {
    badge.textContent = String(ids.size);
    badge.hidden = ids.size === 0;
  });
  markClashes();
}

/** Planned rows on this page that overlap in time get a clash line. */
export function markClashes() {
  const rows = [...document.querySelectorAll<HTMLElement>("[data-row][data-start]")];
  const planned = rows
    .filter((r) => r.dataset.inPlan === "true")
    .map((r) => {
      const start = Date.parse(r.dataset.start!);
      const end = eventEndMs(r.dataset.start!, r.dataset.end);
      const title = r.querySelector(".title")?.textContent?.trim() ?? "";
      return { row: r, start, end, title, startIso: r.dataset.start! };
    })
    .sort((a, b) => a.start - b.start);

  for (const row of rows) {
    const line = row.querySelector<HTMLElement>("[data-clash]");
    if (!line) continue;
    const me = planned.find((p) => p.row === row);
    const other = me && planned.find((p) => p !== me && p.start < me.end && me.start < p.end);
    if (other) {
      const short = other.title.length > 32 ? `${other.title.slice(0, 30)}…` : other.title;
      line.textContent = `Clashes with ${formatTime(other.startIso)} ${short}`;
      line.hidden = false;
    } else {
      line.textContent = "";
      line.hidden = true;
    }
  }
}

document.addEventListener("click", (e) => {
  const star = (e.target as Element).closest<HTMLButtonElement>("[data-star]");
  if (!star) return;
  e.preventDefault();
  const on = togglePlan(star.dataset.star!);
  announce(on ? `Added ${star.dataset.title} to my plan` : `Removed ${star.dataset.title} from my plan`);
});

document.addEventListener("plan-change", () => syncPlan());
// Content added later (the schedule's bottom sheet) picks up the current state.
new MutationObserver((records) => {
  for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && syncPlan(n));
}).observe(document.body, { childList: true, subtree: true });

// Back/forward restores a page from memory; catch up with stars made since.
window.addEventListener("pageshow", (e) => {
  if (e.persisted) syncPlan();
});

watchOtherTabs();
syncPlan();
