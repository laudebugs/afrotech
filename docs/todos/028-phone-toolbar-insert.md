# 028 — Phone toolbar and Insert menu

**Status:** todo (plan in draft) · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 027

## Goal

Make writing a note on a phone quick: formats one tap away, and session details inserted for you.

## Done when

- [ ] A toolbar row sits above the on-screen keyboard while typing (`visualViewport`), and below the editor on desktop
- [ ] Buttons: heading, bold, italic, bulleted list, task list, quote, link, undo, Insert; each shows its state (`aria-pressed`)
- [ ] Insert adds: the session's title, time and room; its speakers linked to their pages; the current Houston time; a link to another session found by search
- [ ] Works with the keyboard and screen readers; 44 px targets; respects `prefers-reduced-motion`
- [ ] Tested on iOS Safari and Android Chrome sizes
