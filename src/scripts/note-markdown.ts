// Renders a note's Markdown to HTML for the note page (plan 0005), matching
// what the editor writes (plan 0006): tables, strikethrough and task lists.
import MarkdownIt from "markdown-it";

// Raw HTML stays text, so a pasted <script> can't run; markdown-it's own
// link check already refuses javascript: and similar URLs.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const defaultLink = md.renderer.rules.link_open ?? ((t, i, o, _e, self) => self.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, i, options, env, self) => {
  tokens[i]!.attrSet("rel", "noopener nofollow");
  return defaultLink(tokens, i, options, env, self);
};

// Task lists ("- [ ] " and "- [x] "), which markdown-it leaves as text. The
// boxes are read-only here; tick them in the editor.
md.core.ruler.after("inline", "task-lists", (state) => {
  const tokens = state.tokens;
  for (let i = 2; i < tokens.length; i++) {
    const inline = tokens[i]!;
    const item = tokens[i - 2]!;
    if (inline.type !== "inline" || tokens[i - 1]!.type !== "paragraph_open" || item.type !== "list_item_open") continue;
    // Only bulleted items: "1. [x]" keeps its number and stays text.
    if (item.markup === "." || item.markup === ")") continue;
    const match = /^\[([ xX])\](\s|$)/.exec(inline.content);
    const first = inline.children?.[0];
    if (!match || first?.type !== "text") continue;
    first.content = first.content.slice(match[0].length);
    const box = new state.Token("html_inline", "", 0);
    box.content = `<input type="checkbox" disabled${match[1] === " " ? "" : " checked"}> `;
    inline.children!.unshift(box);
    item.attrJoin("class", "task-item");
  }
});

// Photos (plan 0006): ![alt](photo:<id>) has no URL a browser can load, so it
// renders as <img data-photo="<id>">, and showNotePhotos() fills in the image.
const defaultImage = md.renderer.rules.image!;
md.renderer.rules.image = (tokens, i, options, env, self) => {
  const token = tokens[i]!;
  const src = token.attrGet("src") ?? "";
  const id = /^photo:([\w-]{8,64})$/.exec(src)?.[1];
  if (!id) return defaultImage(tokens, i, options, env, self);
  const alt = md.utils.escapeHtml(self.renderInlineAsText(token.children ?? [], options, env));
  return `<img class="note-photo" data-photo="${id}" alt="${alt}">`;
};

export const renderNote = (markdown: string) => md.render(markdown);
