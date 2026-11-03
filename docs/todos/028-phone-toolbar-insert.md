# 028 — Phone toolbar and Insert menu

**Status:** done (plan in draft) · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 027

## Goal

Make writing a note on a phone quick: formats one tap away, and session details inserted for you.

## Done when

- [x] A toolbar row sits above the on-screen keyboard while typing (`visualViewport`), and below the editor on desktop
- [x] Buttons: heading, bold, italic, bulleted list, task list, quote, link, undo, Insert; each shows its state (`aria-pressed`)
- [x] Insert adds: the session's title, time and room; its speakers linked to their pages; the current Houston time; a link to another session found by search
- [x] Works with the keyboard and screen readers; 44 px targets; respects `prefers-reduced-motion`
- [x] Tested on iOS Safari and Android Chrome sizes

## Notes

Built on November 3:

- **Toolbar:** `src/scripts/note-toolbar.ts` builds one row of 44 px icon
  buttons. The common tools come first: heading, bold, italic, bulleted list,
  checklist, quote, link and Insert. Numbered list, strikethrough, code block,
  undo and redo follow, and the row scrolls sideways on a phone. A Table button
  appears only while the cursor is in a table, with add and delete for rows,
  columns and the table.
  - **State:** format buttons show their state with `aria-pressed`. Undo and
    redo use `aria-disabled`, so arrow keys still reach them.
  - **Keyboard:** the row is an ARIA toolbar with one tab stop. Arrow keys,
    Home and End move between buttons, and Escape closes a panel.
  - **Selection:** tapping a tool keeps the editor's selection and keyboard
    (`pointerdown` is cancelled).
- **Position:** the toolbar pins under the page header as you scroll. While
  you type on a phone, with the keyboard covering more than 120 px, it fixes
  itself just above the keyboard (`visualViewport`). This was tested with a
  simulated keyboard; it still needs a check on a real iPhone and Android
  phone.
- **Link:** a small form takes the address, adds `https://` if it's missing,
  and puts the cursor after the link. With nothing selected, the address
  becomes the link text.
  - **Not a `<form>`:** the panel is a plain `div`, because the toolbar sits
    inside the note's own form and forms can't nest. A nested form broke
    Enter.
- **Insert:**
  - **Session:** the session's title (bold), time and room.
  - **Speakers:** one line each, linked to their profile, with role and
    company. The editor page's session lookup now carries speakers
    (`NoteEventLookup withSpeakers`).
  - **Current time:** in Houston time and bold, ready for a quote.
  - **Link to a session:** a search over every session title, with the top
    eight results.
  - **Table:** a table with a header row.
- **Markdown view:** the toolbar hides while the Markdown view is showing,
  since its tools act on the formatted view.

