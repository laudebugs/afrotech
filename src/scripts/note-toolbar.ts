// The editor's toolbar (plan 0006, todo 028): formats, a link form, table
// tools and an Insert menu for session details. On a phone it rides just above
// the on-screen keyboard while you type.
import type { Editor } from "@tiptap/core";
import { allNoteEvents, noteEvent } from "../lib/note-events";
import { formatTime } from "../lib/time";
import { newPhotoId, savePhoto } from "../lib/photos";
import { shrinkPhoto } from "../lib/shrink-photo";

type PanelKind = "link" | "insert" | "table" | "sessions";

type Tool = {
  id: string;
  label: string;
  icon: string;
} & (
  | {
      /** A plain or toggle button. */
      run: (e: Editor) => void;
      /** Lit (aria-pressed) when true. */
      active?: (e: Editor) => boolean;
      /** Greyed out (aria-disabled) when false. */
      can?: (e: Editor) => boolean;
    }
  | {
      /** Opens a panel below the row. */
      panel: PanelKind;
      /** Shown only when true. */
      when?: (e: Editor) => boolean;
    }
);

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

// The common tools first; the row scrolls sideways on a phone.
const TOOLS: Tool[] = [
  { id: "heading", label: "Heading", icon: ICONS.heading, run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive("heading", { level: 2 }) },
  { id: "bold", label: "Bold", icon: ICONS.bold, run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold") },
  { id: "italic", label: "Italic", icon: ICONS.italic, run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic") },
  { id: "bullets", label: "Bulleted list", icon: ICONS.bullets, run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
  { id: "tasks", label: "Checklist", icon: ICONS.tasks, run: (e) => e.chain().focus().toggleTaskList().run(), active: (e) => e.isActive("taskList") },
  { id: "quote", label: "Quote", icon: ICONS.quote, run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
  { id: "link", label: "Link", icon: ICONS.link, panel: "link" },
  { id: "insert", label: "Insert", icon: ICONS.insert, panel: "insert" },
  { id: "numbers", label: "Numbered list", icon: ICONS.numbers, run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
  { id: "strike", label: "Strikethrough", icon: ICONS.strike, run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive("strike") },
  { id: "code", label: "Code block", icon: ICONS.code, run: (e) => e.chain().focus().toggleCodeBlock().run(), active: (e) => e.isActive("codeBlock") },
  { id: "table", label: "Table tools", icon: ICONS.table, panel: "table", when: (e) => e.isActive("table") },
  { id: "undo", label: "Undo", icon: ICONS.undo, run: (e) => e.chain().focus().undo().run(), can: (e) => e.can().undo() },
  { id: "redo", label: "Redo", icon: ICONS.redo, run: (e) => e.chain().focus().redo().run(), can: (e) => e.can().redo() },
];

/** Escapes the characters Markdown would read as formatting in a title or name. */
const plain = (text: string) => text.replace(/([\\`*_~[\]<>|#!])/g, "\\$1");

export function attachToolbar(opts: { root: HTMLElement; editor: Editor; eventId: string }) {
  const { root, editor, eventId } = opts;
  const slot = root.parentElement!; // keeps the toolbar's space while it floats
  const tools = root.querySelector<HTMLElement>("[data-tools]")!;
  const panel = root.querySelector<HTMLElement>("[data-panel]")!;

  // --- Buttons: one tab stop, arrow keys between them (ARIA toolbar) -------
  const buttons = new Map<string, HTMLButtonElement>();
  for (const tool of TOOLS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tool";
    b.dataset.tool = tool.id;
    b.setAttribute("aria-label", tool.label);
    b.title = tool.label;
    b.innerHTML = tool.icon;
    if ("panel" in tool) {
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-controls", panel.id);
    } else if (tool.active) {
      b.setAttribute("aria-pressed", "false");
    }
    b.tabIndex = -1;
    tools.append(b);
    buttons.set(tool.id, b);
  }
  const shown = () => [...buttons.values()].filter((b) => !b.hidden);
  /** Makes `b` the toolbar's one tab stop. */
  const setTabStop = (b: HTMLButtonElement) => buttons.forEach((x) => (x.tabIndex = x === b ? 0 : -1));
  setTabStop(buttons.get("heading")!);

  tools.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openFor) {
      e.preventDefault();
      return closePanel(true);
    }
    const list = shown();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    const target = list[(next + list.length) % list.length]!;
    setTabStop(target);
    target.focus();
  });

  // Tapping a tool keeps the editor's selection and keyboard.
  tools.addEventListener("pointerdown", (e) => {
    if ((e.target as Element).closest(".tool")) e.preventDefault();
  });
  tools.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".tool");
    if (!b || b.getAttribute("aria-disabled") === "true") return;
    setTabStop(b);
    const tool = TOOLS.find((t) => t.id === b.dataset.tool)!;
    if ("panel" in tool) return togglePanel(tool.panel, b);
    closePanel();
    tool.run(editor);
  });

  function refresh() {
    for (const tool of TOOLS) {
      const b = buttons.get(tool.id)!;
      if ("panel" in tool) {
        if (tool.when) b.hidden = !tool.when(editor);
      } else {
        if (tool.active) b.setAttribute("aria-pressed", String(tool.active(editor)));
        // aria-disabled, not disabled, so arrow keys still reach it.
        if (tool.can) b.setAttribute("aria-disabled", String(!tool.can(editor)));
      }
    }
    // A hidden button can't keep the tab stop or an open panel.
    if (shown().every((b) => b.tabIndex !== 0)) setTabStop(buttons.get("heading")!);
    if (openFor?.hidden) closePanel();
  }

  // --- Panels: link form, Insert menu, table tools, session search ---------
  let openFor: HTMLButtonElement | null = null;
  /** Counts panel openings, so an action can tell if it opened another. */
  let opened = 0;
  function closePanel(refocus = false) {
    if (!openFor) return;
    panel.hidden = true;
    panel.replaceChildren();
    openFor.setAttribute("aria-expanded", "false");
    openFor = null;
    if (refocus) editor.commands.focus();
    place();
  }
  function togglePanel(kind: PanelKind, from: HTMLButtonElement) {
    if (openFor === from && kind !== "sessions") return closePanel(true);
    closePanel();
    openFor = from;
    opened++;
    from.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    ({ link: linkPanel, insert: insertPanel, table: tablePanel, sessions: sessionPanel })[kind]();
    place();
  }
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel(true);
    }
  });
  // A tap anywhere else, the editor included, closes the panel.
  document.addEventListener("pointerdown", (e) => {
    if (openFor && !root.contains(e.target as Node)) closePanel();
  });

  /** A panel button that does something, then closes the panel. */
  const action = (label: string, run: () => void, cls = "panel-item") => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("pointerdown", (e) => e.preventDefault());
    b.addEventListener("click", () => {
      const before = opened;
      run();
      if (opened === before) closePanel(); // unless run() opened another panel
    });
    return b;
  };
  const title = (text: string) => {
    const h = document.createElement("p");
    h.className = "panel-title";
    h.textContent = text;
    return h;
  };
  const removeLink = () => editor.chain().focus().extendMarkRange("link").unsetLink().run();
  /** Inserts linked text, then a space, so typing carries on unlinked. */
  const insertLink = (text: string, href: string) =>
    editor
      .chain()
      .focus()
      .insertContent([
        { type: "text", text, marks: [{ type: "link", attrs: { href } }] },
        { type: "text", text: " " },
      ])
      .run();

  function linkPanel() {
    const current = (editor.getAttributes("link").href as string | undefined) ?? "";
    // A div, not a <form>: the toolbar sits inside the note's own form, and
    // forms can't nest (a nested one broke Enter).
    const row = document.createElement("div");
    row.className = "panel-form";
    const input = document.createElement("input");
    input.type = "url";
    input.inputMode = "url";
    input.placeholder = "https://…";
    input.value = current;
    input.setAttribute("aria-label", "Link address");
    const apply = () => {
      let href = input.value.trim();
      if (!href) return void removeLink();
      if (!/^(https?:|mailto:|\/)/i.test(href)) href = `https://${href}`;
      if (editor.state.selection.empty && !editor.isActive("link")) {
        // Nothing selected: the address becomes the link text.
        insertLink(href, href);
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        // Put the cursor after the link, so the next key doesn't replace it.
        editor.chain().setTextSelection(editor.state.selection.to).unsetMark("link").run();
      }
    };
    const applyButton = action("Apply", apply, "panel-action primary");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyButton.click();
      }
    });
    row.append(input, applyButton);
    if (current) row.append(action("Remove", () => void removeLink(), "panel-action"));
    panel.append(row);
    input.focus();
  }

  function insertPanel() {
    const info = noteEvent(eventId);
    const items: HTMLButtonElement[] = [];
    const md = (markdown: string) => void editor.chain().focus().insertContent(markdown, { contentType: "markdown" }).run();
    if (info) {
      items.push(action("Session title, time and room", () => md(`**${plain(info.title)}**  \n${plain(info.when)} · ${plain(info.place)}`)));
      if (info.speakers?.length) {
        const lines = info.speakers.map((s) => {
          const name = s.slug ? `[${plain(s.name)}](/speakers/${s.slug}/)` : plain(s.name);
          return `- ${name}${s.role ? ` · ${plain(s.role)}` : ""}`;
        });
        items.push(action(`Speakers (${info.speakers.length})`, () => md(lines.join("\n"))));
      }
    }
    items.push(
      // Houston time in bold, ready for a quote: "**2:47 PM** ".
      action("Current time", () =>
        void editor
          .chain()
          .focus()
          .insertContent([
            { type: "text", text: formatTime(new Date()), marks: [{ type: "bold" }] },
            { type: "text", text: " " },
          ])
          .run(),
      ),
      action("Photo…", pickPhoto),
      action("Link to a session…", () => togglePanel("sessions", buttons.get("insert")!)),
      action("Table", () => void editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()),
    );
    panel.append(title("Insert"), ...items);
    items[0]!.focus();
  }

  /** Opens the camera or photo library, then asks for alt text. */
  function pickPhoto() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) void photoPanel(file);
    });
    input.click(); // still inside the tap, so browsers allow it
  }

  async function photoPanel(file: File) {
    const insert = buttons.get("insert")!;
    closePanel();
    openFor = insert;
    opened++;
    insert.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    const status = document.createElement("p");
    status.className = "panel-note";
    status.setAttribute("role", "status");
    status.textContent = "Preparing the photo…";
    panel.append(title("Photo"), status);
    place();

    let blob: Blob;
    try {
      blob = await shrinkPhoto(file);
    } catch {
      status.textContent = "This photo couldn't be opened here. Try a JPEG or PNG, or take the photo again.";
      return;
    }
    if (openFor !== insert) return; // closed while shrinking
    const preview = document.createElement("img");
    preview.className = "panel-preview";
    preview.alt = "";
    preview.src = URL.createObjectURL(blob);
    const label = document.createElement("label");
    label.className = "panel-label";
    label.textContent = "Describe the photo, for anyone who can't see it";
    const alt = document.createElement("input");
    alt.placeholder = "e.g. Slide: three steps to an AI policy";
    alt.maxLength = 200;
    label.append(alt);
    // Alt text is required: "Add photo" does nothing until there is some.
    const add = document.createElement("button");
    add.type = "button";
    add.className = "panel-action primary";
    add.textContent = "Add photo";
    add.setAttribute("aria-disabled", "true");
    add.addEventListener("pointerdown", (e) => e.preventDefault());
    add.addEventListener("click", () => {
      // Brackets would end the Markdown's alt text early.
      const text = alt.value.replace(/[[\]\s]+/g, " ").trim();
      if (!text) return alt.focus();
      const id = newPhotoId();
      void savePhoto({ id, blob, uploaded: false, addedAt: Date.now() });
      editor.chain().focus().setImage({ src: `photo:${id}`, alt: text }).run();
      URL.revokeObjectURL(preview.src);
      closePanel();
    });
    alt.addEventListener("input", () => add.setAttribute("aria-disabled", String(!alt.value.trim())));
    alt.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        add.click();
      }
    });
    const row = document.createElement("div");
    row.className = "panel-form";
    row.append(add, action("Cancel", () => URL.revokeObjectURL(preview.src), "panel-action"));
    status.textContent = `Ready: ${Math.round(blob.size / 1024)} KB.`;
    panel.append(preview, label, row);
    alt.focus();
    place();
  }

  function tablePanel() {
    const c = () => editor.chain().focus();
    const items = [
      action("Add row below", () => void c().addRowAfter().run()),
      action("Add column right", () => void c().addColumnAfter().run()),
      action("Delete row", () => void c().deleteRow().run()),
      action("Delete column", () => void c().deleteColumn().run()),
      action("Delete table", () => void c().deleteTable().run()),
    ];
    panel.append(title("Table"), ...items);
    items[0]!.focus();
  }

  function sessionPanel() {
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Search sessions";
    input.setAttribute("aria-label", "Search sessions to link");
    const count = document.createElement("p");
    count.className = "visually-hidden";
    count.setAttribute("role", "status");
    const results = document.createElement("ul");
    results.className = "panel-results";
    const all = allNoteEvents();
    const show = () => {
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = words.length
        ? all.filter(([, e]) => words.every((w) => e.title.toLowerCase().includes(w))).slice(0, 8)
        : [];
      results.replaceChildren(
        ...hits.map(([id, e]) => {
          const li = document.createElement("li");
          const b = action(e.title, () => insertLink(e.title, `/event/${id}/`));
          const when = document.createElement("span");
          when.className = "muted";
          when.textContent = ` · ${e.when}`;
          b.append(when);
          li.append(b);
          return li;
        }),
      );
      if (words.length && !hits.length) {
        const li = document.createElement("li");
        li.className = "muted";
        li.textContent = "No sessions match.";
        results.append(li);
      }
      count.textContent = words.length ? `${hits.length || "No"} ${hits.length === 1 ? "session" : "sessions"} found` : "";
      place();
    };
    input.addEventListener("input", show);
    panel.append(title("Link to a session"), input, count, results);
    input.focus();
  }

  // --- On a phone, ride above the keyboard ---------------------------------
  // While you're typing and the keyboard covers part of the screen, the
  // toolbar fixes itself to the bottom of the visible area, and an open panel
  // grows upward. A pinch-zoom also shrinks the visible area, so it's ignored.
  const vv = window.visualViewport;
  function place() {
    const zoomed = (vv?.scale ?? 1) > 1.05;
    const keyboardOpen = vv ? !zoomed && window.innerHeight - vv.height > 120 : false;
    const typing = editor.isFocused || root.contains(document.activeElement);
    const floating = typing && keyboardOpen;
    if (floating && !root.hasAttribute("data-floating")) {
      // Hold the toolbar's place, so the note doesn't jump up.
      slot.style.minHeight = `${root.offsetHeight}px`;
    }
    root.toggleAttribute("data-floating", floating);
    if (!floating) slot.style.minHeight = "";
    if (floating && vv) {
      root.style.left = `${vv.offsetLeft}px`;
      root.style.width = `${vv.width}px`;
      root.style.top = `${vv.offsetTop + vv.height - root.offsetHeight}px`;
    } else {
      root.style.left = root.style.width = root.style.top = "";
    }
  }

  editor.on("transaction", refresh);
  refresh();
  editor.on("focus", place);
  // Focus may be moving into the toolbar's panel; check once it lands.
  editor.on("blur", () => setTimeout(place));
  root.addEventListener("focusout", () => setTimeout(place));
  vv?.addEventListener("resize", place);
  vv?.addEventListener("scroll", place);
}
