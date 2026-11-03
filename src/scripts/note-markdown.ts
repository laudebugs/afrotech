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
    if (inline.type !== "inline" || tokens[i - 1]!.type !== "paragraph_open" || tokens[i - 2]!.type !== "list_item_open") continue;
    const match = /^\[([ xX])\](\s|$)/.exec(inline.content);
    const first = inline.children?.[0];
    if (!match || first?.type !== "text") continue;
    first.content = first.content.slice(match[0].length);
    const box = new state.Token("html_inline", "", 0);
    box.content = `<input type="checkbox" disabled${match[1] === " " ? "" : " checked"}> `;
    inline.children!.unshift(box);
    tokens[i - 2]!.attrJoin("class", "task-item");
    // Mark the enclosing list.
    for (let j = i - 3; j >= 0; j--) {
      const t = tokens[j]!;
      if (t.type === "bullet_list_open" && t.level === tokens[i - 2]!.level - 1) {
        if (!t.attrGet("class")?.includes("task-list")) t.attrJoin("class", "task-list");
        break;
      }
    }
  }
});

export const renderNote = (markdown: string) => md.render(markdown);
