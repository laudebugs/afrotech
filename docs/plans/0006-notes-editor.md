# Plan 0006: Tiptap turns the notes page into a real editor that still saves Markdown

**Status:** approved 2026-11-03 (Tiptap; private notes per plan 0005; photos now; tables and code blocks in) · **Created:** 2026-11-03 ·
**Builds on:** [Plan 0005](0005-notes-in-account.md) (private notes, saved on the device and synced to your account)

Today a note is a title box and a plain textarea. You type Markdown symbols by
hand on a phone keyboard, see no formatting until the note is finished, and
can't add a photo of a slide. This plan swaps the textarea for a formatted
editor built on Tiptap, adds a toolbar that sits above the phone keyboard and
an Insert menu for session details, and adds photos. Notes stay Markdown and
stay private, saved on the device and synced to your account as plan 0005
describes.

## Tiptap fits best: Markdown in and out, no React, a sixth of Milkdown's weight

I compared six editors on what this site needs. The editor has to:

- run in a plain Astro page, since CLAUDE.md asks before adding a UI framework;
- read and write Markdown, because notes are Markdown;
- work well on a phone, where most notes will be written;
- stay small, because the service worker saves pages for offline use.

The sizes below come from bundling each editor with the features this plan
uses (headings, lists, task lists, tables, links, images), minified, then
gzipped. The versions are the latest on npm on November 3.

| Editor | Gzipped size | Markdown | Without React | Notes |
|--------|-------------:|----------|---------------|-------|
| **[Tiptap](https://tiptap.dev/) 3.32** | **160 KB** | Official `@tiptap/markdown`, both ways | Yes | ProseMirror engine; MIT; we build the toolbar |
| [Lexical](https://lexical.dev/) 0.53 | 144 KB | `@lexical/markdown`, both ways | Possible, but its docs and plugins assume React | Meta's engine; still pre-1.0 |
| [CodeMirror 6](https://codemirror.net/) | 206 KB | Edits the Markdown text itself | Yes | A code editor: shows `**` and `#`, no formatted view |
| [OverType](https://github.com/panphora/overtype) 2.7 | 40 KB | Edits the Markdown text itself | Yes | Styles the text as you type; no tables, images or menus |
| [Milkdown Crepe](https://milkdown.dev/) 7.23 | 913 KB | Markdown-native | Yes | Ready-made editor, but bundles CodeMirror and maths |
| [BlockNote](https://www.blocknotejs.org/) 0.57 | (not measured) | Lossy export | No, React only | MPL-2.0; Notion-style blocks |

Tiptap wins on the four needs together. Since version 3.7, its official
Markdown extension [parses and serialises Markdown both
ways](https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage), so a
note opens from Markdown and saves back to Markdown. Tiptap runs from a plain
`<script>`, and its ProseMirror engine has years of fixes for phone keyboards,
autocorrect and voice typing. Tiptap ships no buttons, though, so we build the
toolbar ourselves, which also lets it match the Plum design. Lexical is the close
runner-up, but outside React you wire up most of it yourself. OverType is the
light fallback if 160 KB proves too much. Milkdown Crepe is complete but over
five times heavier.

The editor loads only on the notes editor page, whose own script is 2 KB
gzipped today. Like MapLibre on the city map, Tiptap's bundle is too big for
the service worker's up-front list, so it's saved the first time you open the
editor. After that it works offline.

## The editor covers what a conference note needs

Four groups of features make it a full editor without turning it into a word
processor:

1. **Formatting.** Headings, bold, italic, strikethrough, inline code, quotes,
   bulleted, numbered and task lists, code blocks, links, horizontal rules and
   simple tables. Markdown shortcuts work as you type (`## ` makes a heading,
   `- [ ] ` a task), and so do the usual keyboard shortcuts. Undo, redo and
   pasting from other apps come with Tiptap.
2. **A phone toolbar.** (Since November 4 it stays in place above the note
   instead of riding above the keyboard; see todo 028.) One row of buttons sits above the keyboard while you
   type, placed with the `visualViewport` API. It holds the common formats
   plus an Insert menu, with every button at least 44 px.
3. **Insert menu.** It adds the pieces a session note needs: the session's
   title, time and room; its speakers, linked to their profile pages; the
   current time ("2:47 PM") before a quote; and a link to another session,
   found by search.
4. **A Markdown view.** A toggle shows the raw Markdown, for checking the
   result or pasting Markdown in. Word count and "Saved 2:47 PM" sit under the
   editor.

## Photos are separate files, not base64 inside the note

A photo of a slide straight from a phone camera runs 3–5 MB. The editor resizes
it in the browser to at most 1600 px on the long side and saves it as WebP,
around 150–300 KB. Each photo asks for alt text when you add it.

Photos stay out of the note's text, because base64 would break plan 0005's
storage in three ways:

1. **The note cap.** Plan 0005 caps a note at 100,000 characters. One 200 KB
   photo is about 270,000 characters as base64, so one photo already breaks it.
2. **Device storage.** Notes live in `localStorage`, which holds about 5 MB for
   the whole site, shared with My plan. That's roughly 18 photos in total.
3. **Sync traffic.** A note syncs whole, so every typo fix would re-upload
   every photo in it.

Instead, each photo gets an id, and the note's Markdown points to it as
`![alt text](photo:<id>)`. Three stores hold the photos themselves:

| Where | Holds | Why |
|-------|-------|-----|
| IndexedDB on the device | Every photo you've added or viewed | Holds hundreds of MB, works offline, keeps photos for signed-out users |
| A private R2 bucket (`afrotech-note-photos`) | Signed-in users' photos, under their account | Built for files; nothing public, and no size limit near ours |
| The Worker | `PUT` and `GET /api/photos/<id>`, for the owner's session only; deletion follows the notes (todo 029) | Photos stay private: no public URL exists |

Photos upload on their own, after the note's text syncs, and only once. The
editor and note view show a photo from IndexedDB, then from the Worker, on any
device. Deleting a note deletes its photos, and Delete my data removes them all.
Each account gets 200 MB, or about 800 photos.

## Three todos, numbered after plan 0005's

| Todo | What | Depends on |
|------|------|-----------|
| 027 | Tiptap editor with Markdown in and out, formatting, tables, code blocks, shortcuts, Markdown view and word count | 024 (done) |
| 028 | Phone toolbar above the keyboard and the Insert menu | 027 |
| 029 | Photos: resize on the phone, IndexedDB on the device, R2 through the Worker for signed-in users | 027, and plan 0005's sync (026) for the upload |

Todo 027 replaces the textarea in plan 0005's editor page and ships on its own.
Todo 029 can ship its on-device half before 026 lands; uploading waits for it.

## Risks

- **Markdown round trips.** Tiptap's Markdown output may differ from yours in
  small ways, such as `*` versus `-` for bullets. Todo 027 tests that the note
  template and sample notes open and save without changing how they render.
- **Two Markdown readers.** Tiptap reads Markdown with `marked`; plan 0005's
  note view uses `markdown-it`. Both follow CommonMark, and todo 027's tests
  render each sample both ways to catch differences.
- **Bundle size.** Tiptap adds 160 KB gzipped to one page. Tables and code
  blocks account for 15 KB of that.
- **Photos on a signed-out device.** IndexedDB can be cleared like
  `localStorage`. The editor says photos are saved on this device only until
  you sign in.

## Decided

1. **Editor:** Tiptap.
2. **Notes:** private, in your account (plan 0005).
3. **Photos:** included now, stored as separate files (IndexedDB and R2), not
   base64.
4. **Tables and code blocks:** included.

Building starts with todo 027. Todo 029 needs one setup step from you: creating
the R2 bucket, or letting me create it with the Cloudflare connection.
