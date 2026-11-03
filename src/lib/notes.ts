// Your notes (plan 0005): kept in localStorage, like My plan, and synced to
// your account when you're signed in. Storage can be blocked; then notes live
// in memory for as long as the page is open.
//
// A deleted note stays as a tombstone (deleted, empty text) so the deletion
// can reach your other devices. Each change is logged with its time, so a sync
// sends only what changed and the server keeps the newest version of a note.

export type Note = {
  id: string;
  eventId: string; // "" for a note that isn't about a session
  title: string;
  body: string;
  createdAt: number; // milliseconds since 1970
  updatedAt: number;
  deleted?: boolean;
};

const KEY = "afrotech:notes";
const CHANGES_KEY = "afrotech:notes-changes";
/** Drafts from before plan 0005, one per event; moved into notes once. */
const OLD_DRAFT_PREFIX = "afrotech:note-draft:";

export const MAX_TITLE = 200;
export const MAX_BODY = 100_000;

let memory: Record<string, Note> | null = null;
let memoryChanges: Record<string, number> | null = null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

/** False when the browser blocks storage, so notes last only while the page is open. */
export const notesPersist = () => memory === null;

/** Every note, tombstones included, by id. */
export function readAllNotes(): Record<string, Note> {
  return memory ? { ...memory } : readJson<Record<string, Note>>(KEY, {});
}

function writeAll(notes: Record<string, Note>, source: "local" | "sync"): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
    memory = null;
  } catch {
    memory = notes;
  }
  document.dispatchEvent(new CustomEvent("notes-change", { detail: { source } }));
}

/** Ids changed on this device since the last sync, with the change time. */
export function readNoteChanges(): Record<string, number> {
  return memoryChanges ? { ...memoryChanges } : readJson<Record<string, number>>(CHANGES_KEY, {});
}

function writeChanges(changes: Record<string, number>): void {
  try {
    localStorage.setItem(CHANGES_KEY, JSON.stringify(changes));
    memoryChanges = null;
  } catch {
    memoryChanges = changes;
  }
}

/** Drops logged changes the server has now seen (unless they changed again since). */
export function forgetSentNoteChanges(sent: Record<string, number>): void {
  const current = readNoteChanges();
  for (const [id, at] of Object.entries(sent)) if (current[id] !== undefined && current[id] <= at) delete current[id];
  writeChanges(current);
}

/** Live notes, newest change first. */
export function listNotes(eventId?: string): Note[] {
  return Object.values(readAllNotes())
    .filter((n) => !n.deleted && (eventId === undefined || n.eventId === eventId))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getNote(id: string): Note | null {
  const note = readAllNotes()[id];
  return note && !note.deleted ? note : null;
}

function newId(): string {
  return crypto.randomUUID();
}

/** Saves a note's text, creating it if needed; returns the saved note. */
export function saveNote(fields: { id?: string; eventId: string; title: string; body: string }): Note {
  const all = readAllNotes();
  const now = Date.now();
  const existing = fields.id ? all[fields.id] : undefined;
  const note: Note = {
    id: existing?.id ?? fields.id ?? newId(),
    eventId: existing?.eventId ?? fields.eventId,
    title: fields.title.slice(0, MAX_TITLE),
    body: fields.body.slice(0, MAX_BODY),
    createdAt: existing?.createdAt ?? now,
    // Never move backwards, even if the clock does.
    updatedAt: Math.max(now, (existing?.updatedAt ?? 0) + 1),
  };
  all[note.id] = note;
  writeChanges({ ...readNoteChanges(), [note.id]: note.updatedAt });
  writeAll(all, "local");
  return note;
}

export function deleteNote(id: string): void {
  const all = readAllNotes();
  const note = all[id];
  if (!note) return;
  const updatedAt = Math.max(Date.now(), note.updatedAt + 1);
  all[id] = { ...note, title: "", body: "", deleted: true, updatedAt };
  writeChanges({ ...readNoteChanges(), [id]: updatedAt });
  writeAll(all, "local");
}

/**
 * Takes the server's notes after a sync. A note changed here since the sync
 * started keeps the local version; otherwise the newer version wins.
 */
export function applySyncedNotes(server: Note[]): void {
  const all = readAllNotes();
  const pending = readNoteChanges();
  let changed = false;
  for (const s of server) {
    const mine = all[s.id];
    if (pending[s.id] !== undefined) continue;
    if (!mine || s.updatedAt > mine.updatedAt) {
      all[s.id] = s;
      changed = true;
    }
  }
  if (changed) writeAll(all, "sync");
}

/** Moves drafts saved by the old GitHub editor into notes, once. */
export function adoptOldDrafts(): void {
  let keys: string[];
  try {
    keys = Object.keys(localStorage).filter((k) => k.startsWith(OLD_DRAFT_PREFIX));
  } catch {
    return;
  }
  for (const key of keys) {
    const draft = readJson<{ title?: string; body?: string }>(key, {});
    const eventId = key.slice(OLD_DRAFT_PREFIX.length);
    if (draft.title || draft.body) {
      saveNote({ eventId: eventId === "untitled" ? "" : eventId, title: draft.title ?? "", body: draft.body ?? "" });
    }
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

/** Another tab changed notes: tell this page. */
export function watchOtherTabsNotes(): void {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) document.dispatchEvent(new CustomEvent("notes-change", { detail: { source: "tab" } }));
  });
}

/** Headings a new note starts with. */
export const NOTE_TEMPLATE = [
  "## Key takeaways",
  "",
  "- ",
  "",
  "## Notable quotes",
  "",
  "> ",
  "",
  "## Resources and links mentioned",
  "",
  "- ",
  "",
  "## People to follow up with",
  "",
  "- ",
  "",
  "## Action items",
  "",
  "- [ ] ",
  "",
].join("\n");
