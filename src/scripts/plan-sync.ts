// Keeps My plan in step across a signed-in person's devices (plan 0002, todo 016).
//
// Signed out, this does nothing and sends nothing: it only runs when the
// sign-in flow (todo 015) has left the "afrotech:signed-in" hint, and the
// server confirms the session. Each sync sends the logged changes and gets the
// merged plan back; the latest change per event wins on the server.
import { applySyncedPlan, forgetSentChanges, readChanges, readPlan, type PlanChange } from "../lib/plan";
import { SIGNED_IN, getItem as get, setItem as set } from "../lib/storage";
import { accountId as whoAmI, forgetAccount } from "./whoami";

const MERGED = "afrotech:plan-merged"; // the account this device's old stars were merged into

let accountId: string | null = null;
let running = false;
let again = false;
let timer = 0;

async function sync(): Promise<void> {
  if (!get(SIGNED_IN)) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    accountId ??= await whoAmI();
    if (!accountId) {
      set(SIGNED_IN, null); // the session ended; stop until the next sign-in
      return;
    }

    const sent: Record<string, PlanChange> = readChanges();
    const changes = Object.entries(sent).map(([eventId, c]) => ({ eventId, ...c }));
    // First sync for this account on this device: upload stars from before
    // sign-in as very old, so they fill gaps but never undo a newer change.
    if (get(MERGED) !== accountId) {
      for (const id of readPlan()) if (!sent[id]) changes.push({ eventId: id, starred: true, updatedAt: 1 });
    }

    const res = await fetch("/api/plan", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    if (res.status === 401) {
      set(SIGNED_IN, null);
      accountId = null;
      forgetAccount();
      return;
    }
    if (!res.ok) return; // try again on the next trigger

    const { items } = (await res.json()) as { items: { eventId: string; starred: boolean }[] };
    forgetSentChanges(sent);
    set(MERGED, accountId);
    // Changes made while the request was in flight still win locally.
    const pending = readChanges();
    const ids = new Set(items.filter((i) => i.starred).map((i) => i.eventId));
    for (const [id, c] of Object.entries(pending)) c.starred ? ids.add(id) : ids.delete(id);
    applySyncedPlan([...ids]);
  } catch {
    // Offline or the server is down: the change log waits for the next try.
  } finally {
    running = false;
    if (again) {
      again = false;
      void sync();
    }
  }
}

function soon() {
  clearTimeout(timer);
  timer = window.setTimeout(sync, 1000);
}

document.addEventListener("plan-change", (e) => {
  const source = (e as CustomEvent<{ source?: string }>).detail?.source;
  if (source === "local") soon(); // not our own result, and not another tab's echo
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void sync();
});
window.addEventListener("online", () => void sync());
void sync();
