// During the week, a tap on any link to /schedule/ goes straight to today's
// page (plan 0010). /schedule/ redirects there anyway, but the redirect costs
// a page load and cancels the page transition. Worked out at the tap, so a
// page left open overnight still opens the right day. The days come from the
// tab bar's data-days, so no event data ships with this script.
import { dayKey } from "../lib/time";

document.addEventListener(
  "click",
  (e) => {
    const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href="/schedule/"]') : null;
    if (!link) return;
    let days: string[] = [];
    try {
      days = JSON.parse(document.querySelector<HTMLElement>(".app-nav")?.dataset.days ?? "[]");
    } catch {}
    const today = dayKey(new Date());
    if (days.includes(today)) link.href = `/schedule/${today}/`;
  },
  true,
);
