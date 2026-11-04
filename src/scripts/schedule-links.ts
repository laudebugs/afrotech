// During the week, links to /schedule/ go straight to today's page (plan
// 0010). /schedule/ redirects there anyway, but the redirect costs a page load
// and cancels the page transition. Each link remembers it was a /schedule/
// link (data-schedule-link) and is pointed at today when the page loads, so
// prefetch fetches the page that will open, and again at every tap, so a page
// left open overnight still opens the right day. The days come from the tab
// bar's data-schedule-days, so no event data ships with this script.
import { dayKey, previewNow } from "../lib/time";

function todayHref(): string {
  let days: string[] = [];
  try {
    days = JSON.parse(document.querySelector<HTMLElement>("[data-schedule-days]")?.dataset.scheduleDays ?? "[]");
  } catch {}
  const today = dayKey(new Date(previewNow()));
  return days.includes(today) ? `/schedule/${today}/` : "/schedule/";
}

function point(link: HTMLAnchorElement) {
  link.dataset.scheduleLink = "";
  link.setAttribute("href", todayHref());
}

document.querySelectorAll<HTMLAnchorElement>('a[href="/schedule/"]').forEach(point);
document.addEventListener(
  "click",
  (e) => {
    const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href="/schedule/"], a[data-schedule-link]') : null;
    if (link) point(link);
  },
  true,
);
