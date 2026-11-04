// Keeps your notes in step across your devices (plan 0005, todo 026).
//
// Like plan sync, this does nothing for a signed-out visitor: it runs only
// when the "afrotech:signed-in" hint is set and the server confirms the
// session. Each sync sends the notes changed on this device, then reads every
// note written to the account since this device's cursor, a page at a time.
import {
  MAX_BODY,
  MAX_TITLE,
  applySyncedNotes,
  cleanEventId,
  clearLocalNotes,
  clearSyncedNotes,
  forgetSentNoteChanges,
  readAllNotes,
  readNoteChanges,
  type Note,
} from "../lib/notes";
import { SIGNED_IN, getItem as get, setItem as set } from "../lib/storage";
import { api } from "./api";
import { sweepPhotos, syncPhotos } from "./photos-sync";
import { clearPhotos } from "../lib/photos";
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

/** What the server accepts, whatever older code or a stray link left in storage. */
const payload = (n: Note) => ({
  id: n.id,
  eventId: cleanEventId(n.eventId),
  title: n.deleted ? "" : n.title.slice(0, MAX_TITLE),
  body: n.deleted ? "" : n.body.slice(0, MAX_BODY),
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
  deleted: Boolean(n.deleted),
});

/** The session ended without signing out: hide the account's notes on this device. */
function sessionEnded() {
  set(SIGNED_IN, null);
  forgetAccount();
  clearSyncedNotes();
  void clearPhotos(); // like signing out: the account's photos leave the device
}

/** One full sync. Resolves true when every local change reached the server. */
async function run(): Promise<boolean> {
  if (stopped || problem === "limit") return false;
  if (!get(SIGNED_IN)) {
    // Signed out, but this device synced with an account and nobody signed
    // out (an expired session): its synced notes leave the device. No request.
    if (get(MERGED)) clearSyncedNotes();
    return false;
  }
  try {
    const account = await accountId();
    if (stopped) return false;
    if (!account) {
      sessionEnded();
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
    // Send in chunks. Only the last asks for notes since the cursor, so the
    // same page isn't downloaded once per chunk; every answer carries the
    // stored version of any sent note whose change didn't stick.
    for (let i = 0; i === 0 || i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const last = i + CHUNK >= ids.length;
      const body = last ? { since: cursor, changes: chunk.map((id) => payload(all[id])) } : { changes: chunk.map((id) => payload(all[id])) };
      const res = await api("POST", "/api/notes", body);
      if (stopped) return false;
      if (res.status === 401) {
        sessionEnded();
        return false;
      }
      if (res.status === 409) {
        problem = "limit"; // wait for a local change (a deletion can make room); sign-out explains
        return false;
      }
      if (!res.ok) return false; // a server error: the log waits for the next try
      const answer = (await res.json()) as Page;
      forgetSentNoteChanges(Object.fromEntries(chunk.map((id) => [id, sent[id]])));
      applySyncedNotes(answer.notes, answer.conflicts);
      if (last) page = answer;
    }
    set(MERGED, account);

    // Read on until every page since the cursor is in.
    while (page) {
      cursor = page.cursor;
      set(CURSOR, JSON.stringify({ account, cursor }));
      if (!page.more) break;
      const res = await api("GET", `/api/notes?since=${cursor}`);
      if (stopped || !res.ok) return false;
      page = (await res.json()) as Page;
      applySyncedNotes(page.notes);
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
  running = run()
    .then((ok) => {
      // Photos upload once their notes are on the server.
      if (ok) void syncPhotos();
      return ok;
    })
    .finally(() => {
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
  if ((e as CustomEvent<{ source?: string }>).detail?.source !== "local") return;
  problem = null; // a new change, perhaps a deletion that makes room: try again
  soon();
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
void sweepPhotos();
