// Lists your notes on each session's detail (plan 0005). Loaded on every page;
// it only touches sections marked data-my-notes, including ones the schedule's
// bottom sheet adds later.
import { adoptOldDrafts, listNotes, watchOtherTabsNotes } from "../lib/notes";

function fill(root: ParentNode = document) {
  // The Notes tab's count (plan 0007).
  document.querySelectorAll<HTMLElement>("[data-notes-count]").forEach((badge) => {
    const n = listNotes().length;
    badge.textContent = String(n);
    badge.hidden = n === 0;
  });
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
// Only content that brings a notes section (the schedule's bottom sheet) needs filling.
new MutationObserver((records) => {
  for (const r of records) {
    r.addedNodes.forEach((n) => {
      if (n instanceof Element && (n.matches("[data-my-notes]") || n.querySelector("[data-my-notes]"))) fill(n.parentNode ?? n);
    });
  }
}).observe(document.body, { childList: true, subtree: true });
window.addEventListener("pageshow", (e) => e.persisted && fill());
watchOtherTabsNotes();
adoptOldDrafts(); // drafts from the old GitHub editor become notes, on any page
fill();
