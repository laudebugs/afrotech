// The notes editor (plan 0006): Tiptap, reading and writing Markdown. Only
// the editor page imports this, so Tiptap's ~160 KB loads nowhere else.
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";

/** The note's building blocks; the round-trip test uses the same list. */
export function noteExtensions() {
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
    TableKit.configure({ table: { resizable: false } }),
    Placeholder.configure({ placeholder: "Write your note…" }),
    CharacterCount,
  ];
}

export type NoteEditor = {
  editor: Editor;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  words(): number;
  focus(): void;
  destroy(): void;
};

export function createNoteEditor(opts: {
  element: HTMLElement;
  markdown: string;
  label: string;
  onChange: () => void;
}): NoteEditor {
  const editor = new Editor({
    element: opts.element,
    extensions: noteExtensions(),
    content: opts.markdown,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "note-prose note-editor-content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": opts.label,
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
    setMarkdown: (markdown) => editor.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false }),
    words: () => editor.storage.characterCount.words(),
    focus: () => editor.commands.focus(),
    destroy: () => editor.destroy(),
  };
}
