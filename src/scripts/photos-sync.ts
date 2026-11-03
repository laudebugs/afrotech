// Uploads note photos to the account and tidies the device (plan 0006,
// todo 029). Runs after each successful notes sync (notes-sync.ts).
//
// A photo uploads once its note has synced (no change waiting), because the
// Worker accepts a photo only when the stored note links to it.
import { readAllNotes, readNoteChanges } from "../lib/notes";
import { HAS_PHOTOS, allPhotos, deletePhotos, markUploaded, photoIdsIn } from "../lib/photos";
import { SIGNED_IN, getItem } from "../lib/storage";

let problem: "full" | null = null;
/** Why photos stopped uploading, when the server said so. */
export const photosSyncProblem = () => problem;

let running: Promise<void> | null = null;

/** Uploads every photo the account doesn't have yet whose note has synced. */
export function syncPhotos(): Promise<void> {
  running ??= upload().finally(() => (running = null));
  return running;
}

async function upload(): Promise<void> {
  if (!getItem(SIGNED_IN) || !getItem(HAS_PHOTOS)) return;
  const notes = Object.values(readAllNotes()).filter((n) => !n.deleted);
  const waiting = readNoteChanges();
  for (const photo of await allPhotos()) {
    if (photo.uploaded) continue;
    const note = notes.find((n) => waiting[n.id] === undefined && photoIdsIn(n.body).includes(photo.id));
    if (!note) continue; // not saved in a synced note yet
    try {
      const res = await fetch(`/api/photos/${photo.id}?note=${encodeURIComponent(note.id)}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": photo.blob.type },
        body: photo.blob,
      });
      if (res.ok) {
        problem = null;
        await markUploaded(photo.id);
      } else if (res.status === 507) {
        problem = "full";
        return;
      } else if (res.status === 401) {
        return; // signed out elsewhere; notes sync handles it
      }
    } catch {
      return; // offline: try after the next sync
    }
  }
}

const HOUR = 3600_000;

/**
 * Removes photos no note on this device links to any more. A photo that was
 * never uploaded gets a day's grace, in case it's in a note still being
 * written; one the account has (or that came from it) goes after an hour.
 */
export async function sweepPhotos(): Promise<void> {
  if (!getItem(HAS_PHOTOS)) return;
  const linked = new Set(
    Object.values(readAllNotes())
      .filter((n) => !n.deleted)
      .flatMap((n) => photoIdsIn(n.body)),
  );
  const now = Date.now();
  const stale = (await allPhotos()).filter(
    (p) => !linked.has(p.id) && now - p.addedAt > (p.uploaded ? HOUR : 24 * HOUR),
  );
  await deletePhotos(stale.map((p) => p.id));
}
