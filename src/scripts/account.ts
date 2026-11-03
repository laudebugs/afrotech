// The account panel on My plan: Google's sign-in button, or who you are with
// Sign out and Delete my data. Google's script loads only here, only when needed.
import { clearLocalNotes, readNoteChanges } from "../lib/notes";
import { forgetNotesAccount, syncNotesNow } from "./notes-sync";

const SIGNED_IN = "afrotech:signed-in";
const MERGED = "afrotech:plan-merged";

const root = document.querySelector<HTMLElement>("[data-account]");
const accountNote = root?.querySelector<HTMLElement>("[data-account-status]");

const store = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

function show(state: "signed-out" | "signed-in" | "unavailable") {
  root?.querySelectorAll<HTMLElement>("[data-state]").forEach((el) => (el.hidden = el.dataset.state !== state));
}

async function api(method: string, path: string, body?: unknown) {
  return fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

type GoogleId = {
  accounts: {
    id: {
      initialize(options: Record<string, unknown>): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
    };
  };
};

function loadGoogle(): Promise<GoogleId> {
  const existing = (window as unknown as { google?: GoogleId }).google;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve((window as unknown as { google: GoogleId }).google);
    s.onerror = () => reject(new Error("Google's sign-in script didn't load"));
    document.head.append(s);
  });
}

async function onCredential(response: { credential: string }) {
  if (accountNote) accountNote.textContent = "Signing in…";
  const res = await api("POST", "/api/auth/google", { credential: response.credential });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    if (accountNote) accountNote.textContent = error ?? "Sign-in didn't work. Try again.";
    return;
  }
  store(SIGNED_IN, "1");
  location.reload(); // the plan syncs on load
}

async function showSignIn() {
  show("signed-out");
  try {
    const google = await loadGoogle();
    const dark = matchMedia("(prefers-color-scheme: dark)").matches || document.documentElement.dataset.theme === "dark";
    google.accounts.id.initialize({
      client_id: root!.dataset.clientId,
      callback: onCredential,
      ux_mode: "popup",
      use_fedcm_for_button: true,
      context: "signin",
    });
    google.accounts.id.renderButton(root!.querySelector<HTMLElement>("[data-google-button]")!, {
      theme: dark ? "filled_black" : "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
    });
  } catch {
    if (accountNote) accountNote.textContent = "Sign-in isn't available right now (are you offline?).";
  }
}

async function init() {
  if (!root) return;
  const allowed = (root.dataset.hosts ?? "").split(" ");
  if (!allowed.includes(location.hostname)) return show("unavailable");

  let me: { signedIn: boolean; name?: string | null; pictureUrl?: string | null } = { signedIn: false };
  try {
    me = await (await fetch("/api/me", { credentials: "same-origin" })).json();
  } catch {
    if (accountNote) accountNote.textContent = "You're offline; sign-in and sync resume when you reconnect.";
    return;
  }
  if (!me.signedIn) {
    store(SIGNED_IN, null);
    return showSignIn();
  }

  store(SIGNED_IN, "1");
  show("signed-in");
  root.querySelector("[data-name]")!.textContent = me.name ?? "your Google account";
  const img = root.querySelector<HTMLImageElement>("[data-picture]")!;
  if (me.pictureUrl) {
    img.src = me.pictureUrl;
    img.hidden = false;
  }

  root.querySelector("[data-sign-out]")!.addEventListener("click", async () => {
    // Notes are private, so signing out takes them off this device; send any
    // waiting changes first so nothing is lost.
    if (accountNote) accountNote.textContent = "Saving your notes…";
    const synced = await syncNotesNow();
    const waiting = Object.keys(readNoteChanges()).length;
    if (!synced && waiting && !confirm(
      `${waiting === 1 ? "1 note hasn't" : `${waiting} notes haven't`} reached your account yet (are you offline?). ` +
        "Signing out removes notes from this device, so these changes would be lost. Sign out anyway?",
    )) {
      if (accountNote) accountNote.textContent = "Still signed in. Try again once you're online.";
      return;
    }
    await api("POST", "/api/auth/signout", {}).catch(() => undefined);
    store(SIGNED_IN, null);
    store(MERGED, null);
    forgetNotesAccount();
    clearLocalNotes();
    location.reload();
  });

  root.querySelector("[data-delete]")!.addEventListener("click", async () => {
    if (!confirm("Delete your account and the plan and notes saved with it? This device keeps its own copy of both.")) return;
    const res = await api("DELETE", "/api/me", {});
    if (!res.ok) {
      if (accountNote) accountNote.textContent = "Couldn't delete right now. Try again in a moment.";
      return;
    }
    store(SIGNED_IN, null);
    store(MERGED, null);
    forgetNotesAccount();
    if (accountNote) accountNote.textContent = "Deleted. Your account, saved plan and notes are gone; this device keeps its copy.";
    show("signed-out");
    void showSignIn();
  });
}

void init();
