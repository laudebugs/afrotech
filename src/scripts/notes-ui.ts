// Lists your notes on each session's detail (plan 0005). Loaded on every page;
// it only touches sections marked data-my-notes, including ones the schedule's
// bottom sheet adds later.
import { listNotes, watchOtherTabsNotes } from "../lib/notes";

function fill(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-my-notes]").forEach((section) => {
    const notes = listNotes(section.dataset.myNotes!);
    section.hidden = notes.length === 0;
    const items = notes.map((n) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/notes/view/?id=${encodeURIComponent(n.id)}`;
      a.textContent = n.title.trim() || "Untitled note";
      li.append(a);
      return li;
    });
    section.querySelector("ul")?.replaceChildren(...items);
  });
}

document.addEventListener("notes-change", () => fill());
new MutationObserver((records) => {
  for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && fill(n));
}).observe(document.body, { childList: true, subtree: true });
window.addEventListener("pageshow", (e) => e.persisted && fill());
watchOtherTabsNotes();
fill();
