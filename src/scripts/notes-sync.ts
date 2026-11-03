// Keeps your notes in step across your devices (plan 0005, todo 026).
//
// Like plan sync, this does nothing for a signed-out visitor: it runs only
// when the "afrotech:signed-in" hint is set and the server confirms the
// session. Each sync sends the notes changed on this device, then reads every
// note written to the account since this device's cursor, a page at a time.
import {
  applySyncedNotes,
  forgetSentNoteChanges,
  readAllNotes,
  readNoteChanges,
  type Note,
} from "../lib/notes";
import { accountId, forgetAccount } from "./whoami";

const SIGNED_IN = "afrotech:signed-in";
/** The account this device's notes were first merged into. */
const MERGED = "afrotech:notes-merged";
/** { account, cursor }: the last write this device has seen, per account. */
const CURSOR = "afrotech:notes-cursor";
/** The server takes at most this many changes per request. */
const CHUNK = 100;

const get = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const set = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

function readCursor(account: string): number {
  try {
    const c = JSON.parse(get(CURSOR) ?? "null") as { account?: string; cursor?: number } | null;
    return c?.account === account && typeof c.cursor === "number" ? c.cursor : 0;
  } catch {
    return 0;
  }
}

/** Forgets which account this device synced with, so a later sign-in starts fresh. */
export function forgetNotesAccount(): void {
  set(MERGED, null);
  set(CURSOR, null);
}

type Page = { notes: Note[]; cursor: number; more: boolean };

let running: Promise<boolean> | null = null;
let again = false;
let timer = 0;

async function call(method: "GET" | "POST", url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** One full sync. Resolves true when every local change reached the server. */
async function run(): Promise<boolean> {
  if (!get(SIGNED_IN)) return false;
  try {
    const account = await accountId();
    if (!account) {
      set(SIGNED_IN, null);
      return false;
    }

    // Notes changed here, by id. On this device's first sync with the
    // account, every local note goes up too (the server keeps the newer
    // version of each), so notes written before signing in aren't lost.
    const sent: Record<string, number> = readNoteChanges();
    const all = readAllNotes();
    if (get(MERGED) !== account) {
      for (const n of Object.values(all)) if (sent[n.id] === undefined && !n.deleted) sent[n.id] = n.updatedAt;
    }
    const ids = Object.keys(sent).filter((id) => all[id]);

    let cursor = readCursor(account);
    let page: Page | null = null;
    // Send in chunks; each answer carries the first page of notes since the cursor.
    for (let i = 0; i === 0 || i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const res = await call("POST", "/api/notes", { since: cursor, changes: chunk.map((id) => all[id]) });
      if (res.status === 401) {
        set(SIGNED_IN, null);
        forgetAccount();
        return false;
      }
      if (!res.ok) return false; // 409 (note limit) or a server error: the log waits
      page = (await res.json()) as Page;
      forgetSentNoteChanges(Object.fromEntries(chunk.map((id) => [id, sent[id]])));
      applySyncedNotes(page.notes);
      if (!page.more) {
        cursor = page.cursor;
        set(CURSOR, JSON.stringify({ account, cursor }));
      }
    }
    set(MERGED, account);

    // Read on until every page since the cursor is in.
    while (page?.more) {
      const res = await call("GET", `/api/notes?since=${page.cursor}`);
      if (!res.ok) return false;
      page = (await res.json()) as Page;
      applySyncedNotes(page.notes);
      cursor = page.cursor;
      set(CURSOR, JSON.stringify({ account, cursor }));
    }
    return Object.keys(readNoteChanges()).length === 0;
  } catch {
    return false; // offline or the server is down: the change log waits for the next try
  }
}

/** Syncs now; overlapping calls share one run, and a call during a run queues one more. */
export function syncNotesNow(): Promise<boolean> {
  if (running) {
    again = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNotesNow();
    }
  });
  return running;
}

function soon() {
  clearTimeout(timer);
  timer = window.setTimeout(syncNotesNow, 3000);
}

document.addEventListener("notes-change", (e) => {
  if ((e as CustomEvent<{ source?: string }>).detail?.source === "local") soon();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void syncNotesNow();
  else if (timer) {
    // Leaving the tab: send what's waiting rather than after the pause.
    clearTimeout(timer);
    timer = 0;
    void syncNotesNow();
  }
});
window.addEventListener("online", () => void syncNotesNow());
void syncNotesNow();
