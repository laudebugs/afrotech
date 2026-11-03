// Shared pieces for the event lists the map pages build in the browser:
// rows with a time, a title link and a "my plan" star. Styles live in
// src/styles/event-rows.css; src/scripts/plan-ui.ts handles the stars.

const STAR_ICON =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/></svg>';

/** A "my plan" star button for one event. Call syncPlan() after inserting it. */
export function starButton(id: string, title: string): HTMLButtonElement {
  const star = document.createElement("button");
  star.type = "button";
  star.className = "star-button";
  star.dataset.star = id;
  star.dataset.title = title;
  star.setAttribute("aria-label", `My plan: ${title}`);
  star.innerHTML = STAR_ICON;
  return star;
}

/** One list row: muted lines around a title link, and a star. */
export function eventRow(opts: { id: string; title: string; before: string; after?: string[]; live?: boolean }): HTMLLIElement {
  const li = document.createElement("li");
  if (opts.live) li.dataset.live = "";
  const text = document.createElement("div");
  const time = document.createElement("p");
  time.className = "muted";
  time.textContent = opts.before;
  const a = document.createElement("a");
  a.href = `/event/${opts.id}/`;
  a.textContent = opts.title;
  text.append(time, a);
  for (const line of opts.after ?? []) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = line;
    text.append(p);
  }
  li.append(text, starButton(opts.id, opts.title));
  return li;
}
