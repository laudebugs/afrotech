// Google sign-in (plan 0002, todo 015). Google's button hands the page a signed
// ID token; we check its signature, issuer, audience and expiry, then keep our
// own session. No Google access token is ever stored.
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { COOKIE, sha256Hex } from "./session";
import { deleteAllPhotos } from "./photos";

const GOOGLE_KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const SESSION_DAYS = 30;

type GoogleClaims = JWTPayload & { email?: string; email_verified?: boolean | string; name?: string; picture?: string };

export type AuthEnv = Env & { TEST_JWKS?: string };

/** Checks a Google ID token; returns its claims or throws. */
export async function verifyGoogleToken(token: string, env: AuthEnv): Promise<GoogleClaims> {
  // TEST_JWKS exists only in local .dev.vars, so tests can sign their own tokens.
  const keys = env.TEST_JWKS ? createLocalJWKSet(JSON.parse(env.TEST_JWKS)) : GOOGLE_KEYS;
  const { payload } = await jwtVerify<GoogleClaims>(token, keys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: env.GOOGLE_CLIENT_ID,
  });
  if (!payload.sub) throw new Error("token has no subject");
  return payload;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Finds or creates the account for these claims and starts a session. */
export async function signIn(env: Env, claims: GoogleClaims) {
  const now = new Date();
  const httpsPicture = claims.picture?.startsWith("https://") ? claims.picture : null;
  // Only an address Google has verified is kept: the admin dashboard trusts it.
  const verified = claims.email_verified === true || claims.email_verified === "true";
  const email = verified ? (claims.email ?? null) : null;
  const user = await env.DB.prepare(
    `INSERT INTO users (id, google_sub, email, name, picture_url, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT (google_sub) DO UPDATE
       SET email = excluded.email, name = excluded.name, picture_url = excluded.picture_url
     RETURNING id, name, picture_url AS pictureUrl`,
  )
    .bind(crypto.randomUUID(), claims.sub, email, claims.name ?? null, httpsPicture, now.toISOString())
    .first<{ id: string; name: string | null; pictureUrl: string | null }>();
  if (!user) throw new Error("could not save the account");

  const token = randomToken();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await env.DB.batch([
    // Tidy this person's expired sessions while we're here.
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?1 AND expires_at <= ?2").bind(user.id, now.toISOString()),
    env.DB.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)").bind(
      await sha256Hex(token),
      user.id,
      now.toISOString(),
      expires.toISOString(),
    ),
  ]);
  const cookie = `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}`;
  return { user, cookie };
}

/** Ends the session behind this request's cookie, if any. */
export async function signOut(env: Env, token: string | null): Promise<string> {
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(await sha256Hex(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Deletes the account, with its sessions, stars, notes and photos. */
export async function deleteAccount(env: Env, userId: string): Promise<void> {
  // Photos first: once the account row is gone, nothing would find them.
  await deleteAllPhotos(env, userId);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM plan_items WHERE user_id = ?1").bind(userId),
    env.DB.prepare("DELETE FROM notes WHERE user_id = ?1").bind(userId),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(userId),
    env.DB.prepare("DELETE FROM users WHERE id = ?1").bind(userId),
  ]);
}
