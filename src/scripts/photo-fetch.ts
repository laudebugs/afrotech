// Fetches a photo from the signed-in account (plan 0006, todo 029). No side
// effects on import, so the editor (and its Node tests) can use it.
import { SIGNED_IN, getItem } from "../lib/storage";

/** The photo from the account, or null if signed out, offline or missing. */
export async function fetchPhotoFromAccount(id: string): Promise<Blob | null> {
  if (!getItem(SIGNED_IN)) return null;
  try {
    const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, { credentials: "same-origin" });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}
