// The notes editor (plan 0006): Tiptap, reading and writing Markdown. Only
// the editor page imports this, so Tiptap's ~160 KB loads nowhere else.
import { Editor, Extension, InputRule } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";

/** Turns an image's src (e.g. "photo:<id>") into a URL to show, or null. */
export type ResolveImage = (src: string) => Promise<string | null>;

/** "- [ ] " and "- [x] " make a checklist, as in Markdown. Tiptap's own rule
 *  only catches "[ ] " at the start of a plain paragraph, so after "- " (now a
 *  bullet) the brackets would stay as text. */
const DashTaskShortcut = Extension.create({
  name: "dashTaskShortcut",
  priority: 1000,
  addInputRules() {
    return [
      new InputRule({
        find: /^\[([ xX])\]\s$/,
        handler: ({ state, range, match, chain }) => {
          const $from = state.doc.resolve(range.from);
          if ($from.depth < 2 || $from.node(-1).type.name !== "listItem")
            return null;
          chain()
            .deleteRange(range)
            .toggleTaskList()
            .updateAttributes("taskItem", { checked: match[1] !== " " })
            .run();
        },
      }),
    ];
  },
});

/** Shows a note's images; `resolve` finds photo:<id> on the device or the account. */
const noteImage = (resolve: ResolveImage) =>
  Image.extend({
    addNodeView() {
      return ({ node }) => {
        const img = document.createElement("img");
        img.className = "note-photo";
        let shown = "";
        const show = (attrs: Record<string, unknown>) => {
          img.alt = String(attrs.alt ?? "");
          const src = String(attrs.src ?? "");
          if (src === shown) return;
          shown = src;
          if (!src.startsWith("photo:")) {
            img.src = src;
            return;
          }
          img.removeAttribute("src");
          img.dataset.missing = "";
          void resolve(src).then((url) => {
            if (shown !== src || !url) return;
            img.src = url;
            delete img.dataset.missing;
          });
        };
        show(node.attrs);
        return {
          dom: img,
          update: (next) => {
            if (next.type !== node.type) return false;
            show(next.attrs);
            return true;
          },
        };
      };
    },
  });

/** The note's building blocks; the round-trip test uses the same list. */
export function noteExtensions(resolveImage: ResolveImage = async () => null) {
  return [
    StarterKit.configure({
      // Markdown has no underline.
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer", target: null },
      },
    }),
    Markdown,
    TaskList,
    TaskItem.configure({ nested: true }),
    DashTaskShortcut,
    TableKit.configure({ table: { resizable: false } }),
    noteImage(resolveImage),
    Placeholder.configure({ placeholder: "Write your note…" }),
  ];
}

export type NoteEditor = {
  /** Tiptap itself, for the toolbar's commands. */
  editor: Editor;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  /** The text without Markdown syntax, for counting words. */
  getText(): string;
  focus(): void;
  /** Makes the editor read-only, for good (signed out in another tab). */
  lock(): void;
};

/** Words in plain text: runs of letters or digits ("don't" and "AI-first" count once). */
export const countWords = (text: string) =>
  text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;

export function createNoteEditor(opts: {
  element: HTMLElement;
  markdown: string;
  /** Id of the element that labels the editor. */
  labelledBy: string;
  resolveImage: ResolveImage;
  onChange: () => void;
}): NoteEditor {
  const editor = new Editor({
    element: opts.element,
    extensions: noteExtensions(opts.resolveImage),
    content: opts.markdown,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "note-prose note-editor-content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": opts.labelledBy,
        // Phones: sentence case and autocorrect, as in any notes app.
        autocapitalize: "sentences",
        spellcheck: "true",
      },
    },
    onUpdate: () => opts.onChange(),
  });

  return {
    editor,
    getMarkdown: () => editor.getMarkdown(),
    setMarkdown: (markdown) =>
      editor.commands.setContent(markdown, {
        contentType: "markdown",
        emitUpdate: false,
      }),
    getText: () => editor.getText({ blockSeparator: "\n" }),
    focus: () => editor.commands.focus(),
    lock: () => editor.setEditable(false),
  };
}
