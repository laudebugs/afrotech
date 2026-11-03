// Plan 0006: a note opened in the editor and saved again must render the
// same on the note page. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MarkdownManager } from "@tiptap/markdown";
import { noteExtensions } from "../src/scripts/note-editor.ts";
import { renderNote } from "../src/scripts/note-markdown.ts";
import { NOTE_TEMPLATE } from "../src/lib/notes.ts";

const manager = new MarkdownManager({ extensions: noteExtensions() });
const roundTrip = (markdown: string) => manager.serialize(manager.parse(markdown));
// Neither whitespace between tags nor an empty quote (the template's "> ")
// changes what the reader sees.
const html = (markdown: string) =>
  renderNote(markdown).replace(/>\s+</g, "><").replace(/<blockquote><\/blockquote>/g, "").trim();

const SAMPLES: Record<string, string> = {
  template: NOTE_TEMPLATE,
  everything: [
    "## Key takeaways",
    "",
    "Agents need **guardrails**, not *vibes*. ~~Ship fast~~ Ship safely, with `evals`.",
    "",
    "- First point",
    "- Second point with a [link](https://example.com)",
    "  - Nested point",
    "",
    "1. One",
    "2. Two",
    "",
    "Bullets right before a checklist:",
    "",
    "- plain item",
    "",
    "- [ ] Follow up with the speaker",
    "- [x] Star the next session",
    "",
    "> “Security is a product feature.”",
    "",
    "```",
    "npm run build",
    "```",
    "",
    "| Tool | Use |",
    "| --- | --- |",
    "| Evals | Catch regressions |",
    "| Red team | Find holes |",
    "",
    "---",
    "",
    "Line one",
    "line two right after.",
  ].join("\n"),
};

for (const [name, markdown] of Object.entries(SAMPLES)) {
  test(`${name} renders the same after the editor saves it`, () => {
    assert.equal(html(roundTrip(markdown)), html(markdown));
  });
  test(`${name} is stable: saving twice changes nothing`, () => {
    const once = roundTrip(markdown);
    assert.equal(roundTrip(once), once);
  });
}
