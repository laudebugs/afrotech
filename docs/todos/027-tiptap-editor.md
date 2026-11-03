# 027 — Tiptap editor with Markdown in and out

**Status:** done · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 024

## Goal

Replace the notes textarea with a formatted Tiptap editor that opens and saves Markdown.

## Done when

- [x] Tiptap 3 with StarterKit, `@tiptap/markdown`, task lists, tables, code blocks, links and a placeholder
- [x] The editor opens a note's Markdown and saves Markdown back, as you type, through the note store (`src/lib/notes.ts`)
- [x] Markdown shortcuts (`## `, `- `, `1. `, `- [x] `, `> `, ```` ``` ````) and keyboard shortcuts work
- [x] A Markdown view toggle shows and edits the raw Markdown
- [x] Word count and "Saved 2:47 PM" under the editor
- [x] Styled with design tokens in light and dark mode; 44 px targets
- [x] Tiptap loads only on the editor page; the service worker saves it on first use
- [x] Round-trip tests: the note template and sample notes open and save without changing how the note view renders them

## Notes

Built on November 3:

- **Editor:** `src/scripts/note-editor.ts` sets up Tiptap 3.32 (StarterKit
  without underline, Markdown, task lists, tables, placeholder, character
  count). The editor page imports it, so its 154 KB (gzipped) loads only there.
  It's over the service worker's 200 KB precache limit before compression, so
  it's cached on first use.
- **Markdown view:** "Markdown" swaps the editor for a monospace textarea of
  the raw Markdown; switching back re-reads it and saves.
- **Saving:** unchanged store (`src/lib/notes.ts`), 400 ms after typing stops.
  The status reads "Saved 3:54 PM · 13 words". A note over plan 0005's
  100,000-character cap isn't saved, and the status says so.
- **Note page:** markdown-it rendering moved to `src/scripts/note-markdown.ts`
  and gained task lists (read-only boxes). `src/styles/note-prose.css` styles a
  note the same way in the editor and on the note page: headings, lists,
  checklists, quotes, code, tables that scroll sideways, rules and images.
- **Tests:** `npm test` (Node's test runner) opens the template and a sample
  with every feature in Tiptap, saves it, and checks the note page renders the
  same HTML, and that saving twice changes nothing.
- **Differences found:** the template's empty quote (`> `) disappears when the
  editor saves, since it shows nothing anyway. Tiptap pads table cells
  (`| 1   | 2   |`) and writes `>` inside text as `&gt;`; both render the same.
  A bullet list right before a checklist becomes one list on the note page (as
  in any CommonMark reader), so checklist items are styled one by one.
- **Not yet:** a toolbar. Formatting comes from Markdown shortcuts and
  keyboard shortcuts until todo 028; tables come from the Markdown view.

