// The editor's toolbar (plan 0006, todo 028): formats, a link form, table
// tools and an Insert menu for session details. On a phone it rides just above
// the on-screen keyboard while you type.
import type { Editor } from "@tiptap/core";
import { allNoteEvents, noteEvent } from "../lib/note-events";
import { formatTime } from "../lib/time";

type Tool = {
  id: string;
  label: string;
  icon: string;
  run: (e: Editor) => void;
  /** Lit (aria-pressed) when true; tools without it are plain buttons. */
  active?: (e: Editor) => boolean;
  /** Shown only when true. */
  when?: (e: Editor) => boolean;
};

// 20 px stroke icons, drawn on a 24 px grid.
const svg = (d: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  heading: svg('<path d="M6 4v16M18 4v16M6 12h12"/>'),
  bold: svg('<path d="M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z"/>'),
  italic: svg('<path d="M14 4h-4M14 20h-4M15 4 9 20"/>'),
  strike: svg('<path d="M4 12h16M16 6.5A4 4 0 0 0 12 4c-2.5 0-4 1.5-4 3.5M8 17.5A4 4 0 0 0 12 20c2.5 0 4-1.5 4-3.5"/>'),
  bullets: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  numbers: svg('<path d="M10 6h10M10 12h10M10 18h10M4 4h1.5v4M3.5 8h3M3.5 14.5c.5-1 3-1 3 .5S3.5 17 3.5 19h3"/>'),
  tasks: svg('<rect x="3" y="4" width="6" height="6" rx="1"/><path d="m4.5 16 1.5 1.5L9 14.5M13 7h8M13 16h8"/>'),
  quote: svg('<path d="M4 7h6v6H6l-2 4M14 7h6v6h-4l-2 4"/>'),
  code: svg('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  table: svg('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M10 4v16"/>'),
  undo: svg('<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  redo: svg('<path d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3"/>'),
  insert: svg('<path d="M12 5v14M5 12h14"/>'),
};

const TOOLS: Tool[] = [
  { id: "heading", label: "Heading", icon: ICONS.heading, run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive("heading") },
  { id: "bold", label: "Bold", icon: ICONS.bold, run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold") },
  { id: "italic", label: "Italic", icon: ICONS.italic, run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic") },
  { id: "bullets", label: "Bulleted list", icon: ICONS.bullets, run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
  { id: "tasks", label: "Checklist", icon: ICONS.tasks, run: (e) => e.chain().focus().toggleTaskList().run(), active: (e) => e.isActive("taskList") },
  { id: "quote", label: "Quote", icon: ICONS.quote, run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
  { id: "link", label: "Link", icon: ICONS.link, run: () => {}, active: (e) => e.isActive("link") },
  { id: "insert", label: "Insert", icon: ICONS.insert, run: () => {} },
  { id: "numbers", label: "Numbered list", icon: ICONS.numbers, run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
  { id: "strike", label: "Strikethrough", icon: ICONS.strike, run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive("strike") },
  { id: "code", label: "Code block", icon: ICONS.code, run: (e) => e.chain().focus().toggleCodeBlock().run(), active: (e) => e.isActive("codeBlock") },
  { id: "table", label: "Table tools", icon: ICONS.table, run: () => {}, when: (e) => e.isActive("table") },
  { id: "undo", label: "Undo", icon: ICONS.undo, run: (e) => e.chain().focus().undo().run() },
  { id: "redo", label: "Redo", icon: ICONS.redo, run: (e) => e.chain().focus().redo().run() },
];

/** Escapes the characters Markdown would read as formatting in a title. */
const plain = (text: string) => text.replace(/([\\`*_[\]<>|#])/g, "\\$1");

export function attachToolbar(opts: { root: HTMLElement; editor: Editor; eventId: string }) {
  const { root, editor, eventId } = opts;
  const tools = root.querySelector<HTMLElement>("[data-tools]")!;
  const panel = root.querySelector<HTMLElement>("[data-panel]")!;

  // --- Buttons, with one tab stop and arrow keys between them (ARIA toolbar).
  const buttons = new Map<string, HTMLButtonElement>();
  for (const tool of TOOLS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tool";
    b.dataset.tool = tool.id;
    b.setAttribute("aria-label", tool.label);
    b.title = tool.label;
    b.innerHTML = tool.icon;
    if (tool.active) b.setAttribute("aria-pressed", "false");
    if (["link", "insert", "table"].includes(tool.id)) {
      b.setAttribute("aria-haspopup", "true");
      b.setAttribute("aria-expanded", "false");
      b.removeAttribute("aria-pressed");
    }
    b.tabIndex = -1;
    tools.append(b);
    buttons.set(tool.id, b);
  }
  buttons.get("heading")!.tabIndex = 0;
  const visibleButtons = () => [...buttons.values()].filter((b) => !b.hidden);
  tools.addEventListener("keydown", (e) => {
    const list = visibleButtons();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = list[(next + list.length) % list.length]!;
    list.forEach((b) => (b.tabIndex = b === target ? 0 : -1));
    target.focus();
  });

  // Tapping a tool keeps the editor's selection and keyboard.
  tools.addEventListener("pointerdown", (e) => {
    if ((e.target as Element).closest(".tool")) e.preventDefault();
  });
  tools.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".tool");
    if (!b || b.getAttribute("aria-disabled") === "true") return;
    const id = b.dataset.tool!;
    if (id === "link") return togglePanel("link", b);
    if (id === "insert") return togglePanel("insert", b);
    if (id === "table") return togglePanel("table", b);
    closePanel();
    TOOLS.find((t) => t.id === id)!.run(editor);
  });

  function refresh() {
    for (const tool of TOOLS) {
      const b = buttons.get(tool.id)!;
      if (tool.active) b.setAttribute("aria-pressed", String(tool.active(editor)));
      if (tool.when) b.hidden = !tool.when(editor);
    }
    // aria-disabled, not disabled, so arrow keys still reach them.
    buttons.get("undo")!.setAttribute("aria-disabled", String(!editor.can().undo()));
    buttons.get("redo")!.setAttribute("aria-disabled", String(!editor.can().redo()));
  }
  editor.on("transaction", refresh);
  refresh();

  // --- Panels: link form, Insert menu, table tools, session search ---------
  let openFor: HTMLButtonElement | null = null;
  function closePanel(refocus = false) {
    panel.hidden = true;
    panel.replaceChildren();
    openFor?.setAttribute("aria-expanded", "false");
    openFor = null;
    if (refocus) editor.commands.focus();
  }
  function togglePanel(kind: "link" | "insert" | "table" | "sessions", from: HTMLButtonElement) {
    if (openFor === from && kind !== "sessions") return closePanel(true);
    closePanel();
    openFor = from;
    from.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    if (kind === "link") linkPanel();
    else if (kind === "insert") insertPanel();
    else if (kind === "table") tablePanel();
    else sessionPanel();
  }
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel(true);
    }
  });

  const button = (label: string, onClick: () => void, cls = "panel-item") => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("pointerdown", (e) => e.preventDefault());
    b.addEventListener("click", onClick);
    return b;
  };
  const heading = (text: string) => {
    const h = document.createElement("p");
    h.className = "panel-title";
    h.textContent = text;
    return h;
  };

  function linkPanel() {
    const current = (editor.getAttributes("link").href as string | undefined) ?? "";
    // A div, not a <form>: the toolbar sits inside the note's own form, and
    // forms can't nest.
    const form = document.createElement("div");
    form.className = "panel-form";
    const input = document.createElement("input");
    input.type = "url";
    input.inputMode = "url";
    input.placeholder = "https://…";
    input.value = current;
    input.setAttribute("aria-label", "Link address");
    form.append(input, button("Apply", apply, "panel-action primary"));
    if (current) {
      form.append(
        button("Remove", () => {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          closePanel();
        }, "panel-action"),
      );
    }
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        apply();
      }
    });
    function apply() {
      let href = input.value.trim();
      if (!href) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } else {
        if (!/^(https?:|mailto:|\/)/i.test(href)) href = `https://${href}`;
        if (editor.state.selection.empty && !editor.isActive("link")) {
          // Nothing selected: the address becomes the link text.
          editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
        } else {
          editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          // Put the cursor after the link, so the next key doesn't replace it.
          editor.chain().setTextSelection(editor.state.selection.to).unsetMark("link").run();
        }
      }
      closePanel();
    }
    panel.append(form);
    input.focus();
  }

  function insertPanel() {
    const info = noteEvent(eventId);
    const items: HTMLButtonElement[] = [];
    if (info) {
      items.push(
        button("Session title, time and room", () => {
          editor
            .chain()
            .focus()
            .insertContent(`**${plain(info.title)}**  \n${plain(info.when)} · ${plain(info.place)}`, { contentType: "markdown" })
            .run();
          closePanel();
        }),
      );
      if (info.speakers?.length) {
        items.push(
          button(`Speakers (${info.speakers.length})`, () => {
            const lines = info.speakers!.map((s) => {
              const name = s.slug ? `[${plain(s.name)}](/speakers/${s.slug}/)` : plain(s.name);
              return `- ${name}${s.role ? ` · ${plain(s.role)}` : ""}`;
            });
            editor.chain().focus().insertContent(lines.join("\n"), { contentType: "markdown" }).run();
            closePanel();
          }),
        );
      }
    }
    items.push(
      button("Current time", () => {
        // Houston time, bold, ready for a quote: "**2:47 PM** ".
        editor
          .chain()
          .focus()
          .insertContent([
            { type: "text", text: formatTime(new Date()), marks: [{ type: "bold" }] },
            { type: "text", text: " " },
          ])
          .run();
        closePanel();
      }),
      button("Link to a session…", () => togglePanel("sessions", buttons.get("insert")!)),
      button("Table", () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run();
        closePanel();
      }),
    );
    panel.append(heading("Insert"), ...items);
    items[0]!.focus();
  }

  function tablePanel() {
    const act = (label: string, run: () => boolean) =>
      button(label, () => {
        run();
        closePanel();
      });
    const c = () => editor.chain().focus();
    const items = [
      act("Add row below", () => c().addRowAfter().run()),
      act("Add column right", () => c().addColumnAfter().run()),
      act("Delete row", () => c().deleteRow().run()),
      act("Delete column", () => c().deleteColumn().run()),
      act("Delete table", () => c().deleteTable().run()),
    ];
    panel.append(heading("Table"), ...items);
    items[0]!.focus();
  }

  function sessionPanel() {
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Search sessions";
    input.setAttribute("aria-label", "Search sessions to link");
    const results = document.createElement("div");
    results.className = "panel-results";
    results.setAttribute("role", "list");
    const all = allNoteEvents();
    const show = () => {
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = words.length
        ? all.filter(([, e]) => words.every((w) => e.title.toLowerCase().includes(w))).slice(0, 8)
        : [];
      results.replaceChildren(
        ...hits.map(([id, e]) => {
          const b = button(e.title, () => {
            editor
              .chain()
              .focus()
              .insertContent([
                { type: "text", text: e.title, marks: [{ type: "link", attrs: { href: `/event/${id}/` } }] },
                { type: "text", text: " " },
              ])
              .run();
            closePanel();
          });
          b.setAttribute("role", "listitem");
          const when = document.createElement("span");
          when.className = "muted";
          when.textContent = ` · ${e.when}`;
          b.append(when);
          return b;
        }),
      );
      if (words.length && !hits.length) results.textContent = "No sessions match.";
    };
    input.addEventListener("input", show);
    panel.append(heading("Link to a session"), input, results);
    input.focus();
  }

  // --- On a phone, ride above the keyboard ---------------------------------
  // While the editor has focus and the keyboard covers part of the screen,
  // the toolbar fixes itself to the bottom of the visible area.
  const vv = window.visualViewport;
  let editorFocused = false;
  function place() {
    const keyboardOpen = vv ? window.innerHeight - vv.height > 120 : false;
    const floating = (editorFocused || root.contains(document.activeElement)) && keyboardOpen;
    root.toggleAttribute("data-floating", floating);
    if (floating && vv) {
      root.style.top = `${vv.offsetTop + vv.height - root.offsetHeight}px`;
    } else {
      root.style.top = "";
    }
  }
  editor.on("focus", () => {
    editorFocused = true;
    place();
  });
  editor.on("blur", () => {
    editorFocused = false;
    // Focus may be moving into the toolbar's panel; check after it lands.
    setTimeout(place);
  });
  vv?.addEventListener("resize", place);
  vv?.addEventListener("scroll", place);
  root.addEventListener("focusout", () => setTimeout(place));
}
