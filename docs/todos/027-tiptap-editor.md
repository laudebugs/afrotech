# 027 — Tiptap editor with Markdown in and out

**Status:** todo · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 024

## Goal

Replace the notes textarea with a formatted Tiptap editor that opens and saves Markdown.

## Done when

- [ ] Tiptap 3 with StarterKit, `@tiptap/markdown`, task lists, tables, code blocks, links and a placeholder
- [ ] The editor opens a note's Markdown and saves Markdown back, as you type, through the note store (`src/lib/notes.ts`)
- [ ] Markdown shortcuts (`## `, `- `, `1. `, `- [ ] `, `> `, ```` ``` ````) and keyboard shortcuts work
- [ ] A Markdown view toggle shows and edits the raw Markdown
- [ ] Word count and "Saved 2:47 PM" under the editor
- [ ] Styled with design tokens in light and dark mode; 44 px targets
- [ ] Tiptap loads only on the editor page; the service worker saves it on first use
- [ ] Round-trip tests: the note template and sample notes open and save without changing how the note view renders them
