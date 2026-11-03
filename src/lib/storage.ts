// localStorage that never throws: storage can be blocked (private windows,
// strict settings), and the site must keep working without it.

/** Set while this browser is signed in, so signed-out visitors never call the API. */
export const SIGNED_IN = "afrotech:signed-in";

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores a value, or removes the key when value is null. */
export function setItem(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}
