// Sessions: a random token in an HttpOnly cookie, stored only as a SHA-256 hash.
export const COOKIE = "__Host-session";

export type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
};

export type SignedInUser = { id: string; name: string | null; pictureUrl: string | null };

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
  }
  return null;
}

/** The signed-in user for this request, or null. Never touches D1 without a cookie. */
export async function currentUser(request: Request, env: Env): Promise<SignedInUser | null> {
  const token = readCookie(request, COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{20,200}$/.test(token)) return null;
  const row = await env.DB.prepare(
    `SELECT users.id AS id, users.name AS name, users.picture_url AS pictureUrl
       FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?1 AND sessions.expires_at > ?2`,
  )
    .bind(await sha256Hex(token), new Date().toISOString())
    .first<SignedInUser>();
  return row ?? null;
}
