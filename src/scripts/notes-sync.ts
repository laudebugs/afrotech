// Keeps your notes in step across your devices (plan 0005, todo 026).
//
// Like plan sync, this does nothing for a signed-out visitor: it runs only
// when the "afrotech:signed-in" hint is set and the server confirms the
// session. Each sync sends the notes changed on this device, then reads every
// note written to the account since this device's cursor, a page at a time.
import {
  applySyncedNotes,
  clearLocalNotes,
  forgetSentNoteChanges,
  readAllNotes,
  readNoteChanges,
  type Note,
} from "../lib/notes";
import { SIGNED_IN, getItem as get, setItem as set } from "../lib/storage";
import { accountId, forgetAccount } from "./whoami";

/** The account this device's notes were first merged into. */
const MERGED = "afrotech:notes-merged";
/** { account, cursor }: the last write this device has seen, per account. */
const CURSOR = "afrotech:notes-cursor";
/** The server takes at most this many changes per request. */
const CHUNK = 100;

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

type Page = { notes: Note[]; cursor: number; more: boolean; conflicts?: Note[] };

let running: Promise<boolean> | null = null;
let again = false;
let timer = 0;
/** Set by sign-out: no run may write notes to this device after it. */
let stopped = false;
/** Why the last run failed, when the server said so. */
let problem: "limit" | null = null;

export const notesSyncProblem = () => problem;

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
  if (stopped || problem === "limit" || !get(SIGNED_IN)) return false;
  try {
    const account = await accountId();
    if (stopped) return false;
    if (!account) {
      set(SIGNED_IN, null);
      return false;
    }

    // Notes on this device that belong to a different account (its session
    // ended without signing out) must never upload into this one: clear them.
    // That account still has every note that reached it.
    const merged = get(MERGED);
    if (merged && merged !== account) {
      clearLocalNotes();
      forgetNotesAccount();
    }

    // Notes changed here, by id. On this device's first sync with the
    // account, every local note goes up too (the server keeps the winning
    // version of each), so notes written before signing in aren't lost.
    const sent: Record<string, number> = readNoteChanges();
    const all = readAllNotes();
    if (get(MERGED) !== account) {
      for (const n of Object.values(all)) if (sent[n.id] === undefined && !n.deleted) sent[n.id] = n.updatedAt;
    }
    // A logged change whose note is gone can never be sent; drop it.
    const orphans = Object.keys(sent).filter((id) => !all[id]);
    if (orphans.length) forgetSentNoteChanges(Object.fromEntries(orphans.map((id) => [id, sent[id]])));
    const ids = Object.keys(sent).filter((id) => all[id]);

    let cursor = readCursor(account);
    let page: Page | null = null;
    // Send in chunks; each answer carries the first page of notes since the
    // cursor, plus the stored version of any note whose change lost.
    for (let i = 0; i === 0 || i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const res = await call("POST", "/api/notes", { since: cursor, changes: chunk.map((id) => all[id]) });
      if (stopped) return false;
      if (res.status === 401) {
        set(SIGNED_IN, null);
        forgetAccount();
        return false;
      }
      if (res.status === 409) {
        problem = "limit"; // stop retrying on this page; sign-out explains
        return false;
      }
      if (!res.ok) return false; // a server error: the log waits for the next try
      page = (await res.json()) as Page;
      forgetSentNoteChanges(Object.fromEntries(chunk.map((id) => [id, sent[id]])));
      applySyncedNotes([...page.notes, ...(page.conflicts ?? [])]);
      if (!page.more) {
        cursor = page.cursor;
        set(CURSOR, JSON.stringify({ account, cursor }));
      }
    }
    set(MERGED, account);

    // Read on until every page since the cursor is in.
    while (page?.more) {
      const res = await call("GET", `/api/notes?since=${page.cursor}`);
      if (stopped || !res.ok) return false;
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

/** Signing out: ends syncing for this page and waits for any run in flight. */
export async function stopNotesSync(): Promise<void> {
  stopped = true;
  again = false;
  clearTimeout(timer);
  timer = 0;
  await running?.catch(() => undefined);
}

function soon() {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = 0;
    void syncNotesNow();
  }, 3000);
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
