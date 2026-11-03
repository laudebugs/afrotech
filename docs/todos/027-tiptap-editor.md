# 027 — Tiptap editor with Markdown in and out

**Status:** done · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 024

## Goal

Replace the notes textarea with a formatted Tiptap editor that opens and saves Markdown.

## Done when

- [x] Tiptap 3 with StarterKit, `@tiptap/markdown`, task lists, tables, code blocks, links and a placeholder
- [x] The editor opens a note's Markdown and saves Markdown back, as you type, through the note store (`src/lib/notes.ts`)
- [x] Markdown shortcuts (`## `, `- `, `1. `, `- [ ] `, `> `, and ```` ``` ```` then a space) and keyboard shortcuts work
- [x] A Markdown view toggle shows and edits the raw Markdown
- [x] Word count and "Saved on this device at 2:47 PM" under the editor
- [x] Styled with design tokens in light and dark mode; 44 px targets
- [x] Tiptap loads only on the editor page; the service worker saves it on first use
- [x] Round-trip tests: the note template and sample notes open and save without changing how the note view renders them

## Notes

Built on November 3:

- **Editor:** `src/scripts/note-editor.ts` sets up Tiptap 3.32: StarterKit
  without underline, plus Markdown, task lists, tables and a placeholder. Only
  the editor page imports it, so its 154 KB (gzipped) loads nowhere else. The
  file is over the service worker's 200 KB precache limit before compression,
  so it's cached the first time you open the editor.
- **Checklist shortcut:** Tiptap turns `[ ] ` into a checklist only at the
  start of a plain paragraph. After `- `, the line is already a bullet, so the
  brackets stayed as text. A small input rule in `note-editor.ts` also handles
  `- [ ] ` and `- [x] `.
- **Markdown view:** "Markdown" swaps the editor for a monospace textarea of
  the raw Markdown. Switching back re-reads it only if you changed it, so a
  look never rewrites the note.
- **Saving:** the store is unchanged (`src/lib/notes.ts`), and saves run
  400 ms after typing stops.
  - **Status:** "Saved on this device at 3:54 PM · 13 words". It isn't a live
    region, so screen readers don't announce every save.
  - **Word count:** both views count words the same way, ignoring Markdown
    symbols.
  - **Size cap:** a note over plan 0005's 100,000-character cap isn't saved.
    An announced warning appears, and Done stays on the page instead of
    dropping the changes.
- **Checkboxes:** in the editor, each small box has a 44 px tap target around
  it. On the note page they're read-only.
- **Note page:** markdown-it rendering moved to `src/scripts/note-markdown.ts`
  and gained checklists. Only bulleted items get boxes, so `1. [x]` keeps its
  number. `src/styles/note-prose.css` styles a note the same way in the editor
  and on the note page: headings, lists, checklists, quotes, code, rules,
  images, and tables that scroll sideways.
- **Tests:** `npm test` (Node's test runner) runs three samples through
  Tiptap's Markdown reader and writer:
  - the template;
  - a sample with every formatting feature;
  - more blocks: h1 and h3, a code block with a language, nested checklists,
    `<` and `>` in text, and a numbered `[x]`.

  Each sample must render the same HTML on the note page after saving, and
  saving twice must change nothing. A fourth test checks the checkboxes on the
  note page. I checked the typing shortcuts in a browser. The Cloudflare build
  doesn't run `npm test`.
- **Differences found:**
  - The template's empty quote (`> `) disappears when the editor saves; it
    shows nothing anyway.
  - Tiptap pads table cells (`| 1   | 2   |`) and writes `>` in text as
    `&gt;`. Both render the same.
  - A bullet list right before a checklist becomes one list on the note page,
    as in any CommonMark reader. Checklist items are therefore styled one by
    one.
- **Not yet:** a toolbar. Until todo 028, formatting comes from Markdown and
  keyboard shortcuts, and tables come from the Markdown view.
