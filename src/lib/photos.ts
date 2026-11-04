// Photos in notes (plan 0006, todo 029), kept on this device in IndexedDB.
// A note's Markdown links to a photo as ![alt](photo:<id>); the image itself
// lives here, and, once the note syncs, in the account (src/scripts/photos-sync.ts).
// IndexedDB can be blocked like localStorage; then photos last only while the
// page is open.

export type StoredPhoto = {
  id: string;
  blob: Blob;
  /** True once the account has it, so it needn't upload again. */
  uploaded: boolean;
  /** Set when the account refused it (too large, not an image): no more tries. */
  rejected?: boolean;
  addedAt: number; // milliseconds since 1970
};

import { getItem, setItem } from "./storage";

/** Set once this device has stored a photo, so other visitors never open IndexedDB. */
export const HAS_PHOTOS = "afrotech:has-photos";
export const PHOTO_PREFIX = "photo:";
const DB_NAME = "afrotech-photos";
const STORE = "photos";

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = new Map<string, StoredPhoto>();

function db(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** Runs one request in a transaction; resolves its result, or undefined if storage fails. */
async function request<T>(mode: IDBTransactionMode, make: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const d = await db();
  if (!d) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = d.transaction(STORE, mode);
      const req = make(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
      // A transaction can abort (storage full) without the request failing.
      tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

/** A new random photo id (letters and digits, as the Worker expects). */
export const newPhotoId = () => crypto.randomUUID().replace(/-/g, "");

/** A photo id: letters, digits, _ and -; the Worker (PHOTO_ID) and note-markdown.ts use the same rule. */
export const PHOTO_ID_PATTERN = "[\\w-]{8,64}";

/** The photo ids a note's Markdown links to, as ![alt](photo:<id>). */
export function photoIdsIn(markdown: string): string[] {
  return [...markdown.matchAll(new RegExp(`\\(${PHOTO_PREFIX}(${PHOTO_ID_PATTERN})\\)`, "g"))].map((m) => m[1]!);
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  memory.set(photo.id, photo);
  setItem(HAS_PHOTOS, "1");
  await request("readwrite", (s) => s.put(photo));
}

export async function readPhoto(id: string): Promise<StoredPhoto | undefined> {
  return memory.get(id) ?? (await request("readonly", (s) => s.get(id) as IDBRequest<StoredPhoto | undefined>));
}

export async function allPhotos(): Promise<StoredPhoto[]> {
  const stored = (await request("readonly", (s) => s.getAll() as IDBRequest<StoredPhoto[]>)) ?? [];
  const byId = new Map(stored.map((p) => [p.id, p]));
  for (const p of memory.values()) if (!byId.has(p.id)) byId.set(p.id, p);
  return [...byId.values()];
}

export async function markUploaded(id: string, uploaded = true): Promise<void> {
  const photo = await readPhoto(id);
  if (photo && photo.uploaded !== uploaded) await savePhoto({ ...photo, uploaded });
}

export async function deletePhotos(ids: string[]): Promise<void> {
  for (const id of ids) {
    memory.delete(id);
    revoke(id);
    await request("readwrite", (s) => s.delete(id));
  }
}

/** Signing out: no photo stays on the device. */
export async function clearPhotos(): Promise<void> {
  memory.clear();
  if (!getItem(HAS_PHOTOS)) return; // never stored one: leave IndexedDB unopened
  setItem(HAS_PHOTOS, null);
  for (const id of urls.keys()) revoke(id);
  await request("readwrite", (s) => s.clear());
}

// --- Showing photos --------------------------------------------------------

const urls = new Map<string, string>();
function revoke(id: string) {
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
}

const pending = new Map<string, Promise<string | null>>();

/** A URL the page can show, from this device or (signed in) the account; null if neither has it. */
export function photoUrl(id: string, fetchFromAccount: (id: string) => Promise<Blob | null>): Promise<string | null> {
  const known = urls.get(id);
  if (known) return Promise.resolve(known);
  // Two images asking at once share one lookup (and one object URL).
  let lookup = pending.get(id);
  if (!lookup) {
    lookup = findPhoto(id, fetchFromAccount).finally(() => pending.delete(id));
    pending.set(id, lookup);
  }
  return lookup;
}

async function findPhoto(id: string, fetchFromAccount: (id: string) => Promise<Blob | null>): Promise<string | null> {
  let blob = (await readPhoto(id))?.blob;
  if (!blob) {
    blob = (await fetchFromAccount(id)) ?? undefined;
    if (blob) await savePhoto({ id, blob, uploaded: true, addedAt: Date.now() });
  }
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}
