// Which account this browser is signed in to, asked once per page and shared
// by plan and notes sync. Only called when the "afrotech:signed-in" hint is
// set, so signed-out visitors send nothing.
import { api } from "./api";

let pending: Promise<string | null> | null = null;

export function accountId(): Promise<string | null> {
  pending ??= api("GET", "/api/me")
    .then((res) => res.json() as Promise<{ signedIn: boolean; id?: string }>)
    .then((me) => (me.signedIn && me.id ? me.id : null))
    .catch((err) => {
      pending = null; // offline: ask again next time
      throw err;
    });
  return pending;
}

/** The session ended (a 401): ask again after the next sign-in. */
export function forgetAccount(): void {
  pending = null;
}
