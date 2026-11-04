// The site's only server code (plan 0002). Cloudflare sends /api/* here
// (`run_worker_first` in wrangler.jsonc); every other request is a static file.
import { isAdmin, readMetrics, readTraffic, type AdminEnv } from "./admin";
import { deleteAccount, signIn, signOut, verifyGoogleToken, type AuthEnv } from "./auth";
import { applyNoteChanges, parseNoteChanges, parseSince, readConflicts, readNotes } from "./notes";
import { PHOTO_ID, getPhoto, prunePhotos, putPhoto } from "./photos";
import { applyChanges, parseChanges, readItems } from "./plan";
import { COOKIE, currentUser, readCookie } from "./session";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });

type Handler = (request: Request, env: AuthEnv & AdminEnv, url: URL) => Promise<Response>;

/**
 * Writes must come from our own pages: a same-origin Origin header and a JSON
 * body. Together with the SameSite=Lax cookie, this blocks cross-site posts.
 */
function sameOriginJson(request: Request, url: URL): boolean {
  const origin = request.headers.get("Origin");
  const type = request.headers.get("Content-Type") ?? "";
  return origin === url.origin && type.startsWith("application/json");
}

/** Routes by "METHOD /path". Later todos add sign-in and plan sync here. */
const routes: Record<string, Handler> = {
  "GET /api/me": async (request, env) => {
    const user = await currentUser(request, env);
    return json(
      user ? { signedIn: true, id: user.id, name: user.name, pictureUrl: user.pictureUrl } : { signedIn: false },
    );
  },

  /** Body: { credential } from Google's sign-in button. Sets the session cookie. */
  "POST /api/auth/google": async (request, env, url) => {
    if (!sameOriginJson(request, url)) return json({ error: "forbidden" }, 403);
    const ip = request.headers.get("CF-Connecting-IP") ?? "local";
    const { success } = await env.SIGNIN_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "too many sign-in attempts; try again in a minute" }, 429);
    let credential: unknown;
    try {
      credential = ((await request.json()) as { credential?: unknown }).credential;
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    if (typeof credential !== "string" || credential.length > 4096) return json({ error: "missing credential" }, 400);
    let claims;
    try {
      claims = await verifyGoogleToken(credential, env);
    } catch {
      return json({ error: "Google sign-in couldn't be verified" }, 401);
    }
    const { user, cookie } = await signIn(env, claims);
    return json({ signedIn: true, id: user.id, name: user.name, pictureUrl: user.pictureUrl }, 200, { "Set-Cookie": cookie });
  },

  "POST /api/auth/signout": async (request, env, url) => {
    if (!sameOriginJson(request, url)) return json({ error: "forbidden" }, 403);
    const cookie = await signOut(env, readCookie(request, COOKIE));
    return json({ signedIn: false }, 200, { "Set-Cookie": cookie });
  },

  /** "Delete my data": the account, its sessions, its saved stars, its notes and their photos. */
  "DELETE /api/me": async (request, env, url) => {
    if (!sameOriginJson(request, url)) return json({ error: "forbidden" }, 403);
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, 401);
    await deleteAccount(env, user.id);
    return json({ deleted: true }, 200, { "Set-Cookie": await signOut(env, null) });
  },

  /** The admin dashboard's totals (plan 0011). Anyone but an admin gets "not found". */
  "GET /api/admin/metrics": async (request, env) => {
    if (!(await isAdmin(env, await currentUser(request, env)))) return json({ error: "not found" }, 404);
    return json(await readMetrics(env));
  },

  /** Page traffic from Cloudflare's analytics, for the admin dashboard. */
  "GET /api/admin/traffic": async (request, env) => {
    if (!(await isAdmin(env, await currentUser(request, env)))) return json({ error: "not found" }, 404);
    try {
      return json(await readTraffic(env));
    } catch (err) {
      // Show the admin why, so a wrong token or permission is easy to fix.
      return json({ configured: true, error: err instanceof Error ? err.message : String(err) }, 502);
    }
  },

  "GET /api/plan": async (request, env) => {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, 401);
    return json({ items: await readItems(env, user) });
  },

  /** Body: { changes: [{ eventId, starred, updatedAt }] }. Returns the whole plan. */
  "POST /api/plan": async (request, env, url) => {
    if (!sameOriginJson(request, url)) return json({ error: "forbidden" }, 403);
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, 401);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    const changes = parseChanges(body);
    if (typeof changes === "string") return json({ error: changes }, 400);
    await applyChanges(env, user, changes);
    return json({ items: await readItems(env, user) });
  },

  /** ?since=<cursor> returns a page of notes written after that cursor; none returns from the start. */
  "GET /api/notes": async (request, env, url) => {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, 401);
    return json(await readNotes(env, user, parseSince(url.searchParams.get("since"))));
  },

  /** Body: { since?, changes: [{ id, eventId, title, body, createdAt, updatedAt, deleted }] }.
   *  Applies the changes, then returns { notes, cursor, more, conflicts }: the
   *  first page of notes written after `since` (none when `since` is left out),
   *  minus the versions this request just sent, and the stored version of any
   *  sent note whose change didn't stick. */
  "POST /api/notes": async (request, env, url) => {
    if (!sameOriginJson(request, url)) return json({ error: "forbidden" }, 403);
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, 401);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    const changes = parseNoteChanges(body);
    if (typeof changes === "string") return json({ error: changes }, 400);
    if (!(await applyNoteChanges(env, user, changes))) return json({ error: "note limit reached" }, 409);
    // Photos the stored notes no longer link to go now.
    await prunePhotos(env, user, changes.map((c) => c.id));
    const echo = new Map(changes.map((c) => [c.id, c]));
    const conflicts = await readConflicts(env, user, echo);
    // A device uploading in several requests asks for the page only on the last.
    const since = (body as { since?: unknown }).since;
    if (since === undefined) return json({ notes: [], cursor: 0, more: false, conflicts });
    return json({ ...(await readNotes(env, user, parseSince(since), echo)), conflicts });
  },
};

/**
 * /api/photos/<id>: GET serves a photo to its owner; PUT?note=<id> stores one
 * (the body is the image). Writes need our own Origin, like every write.
 */
async function photoRoute(request: Request, env: AuthEnv, url: URL, id: string): Promise<Response> {
  if (!PHOTO_ID.test(id)) return json({ error: "not found" }, 404);
  if (request.method !== "GET" && request.method !== "PUT") return json({ error: "method not allowed" }, 405);
  if (request.method === "PUT" && request.headers.get("Origin") !== url.origin) return json({ error: "forbidden" }, 403);
  const user = await currentUser(request, env);
  if (!user) return json({ error: "sign in first" }, 401);
  if (request.method === "GET") return (await getPhoto(env, user, id)) ?? json({ error: "not found" }, 404);
  const result = await putPhoto(env, user, id, url.searchParams.get("note"), request);
  return json(result.error ? { error: result.error } : { stored: true }, result.status);
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const photo = /^\/api\/photos\/([^/]+)$/.exec(url.pathname);
  if (photo) {
    try {
      return await photoRoute(request, env, url, photo[1]!);
    } catch (err) {
      console.error("api error", url.pathname, err);
      return json({ error: "temporarily unavailable" }, 503);
    }
  }
  const handler = routes[`${request.method} ${url.pathname}`];
  if (!handler) {
    const known = Object.keys(routes).some((r) => r.endsWith(` ${url.pathname}`));
    return json({ error: known ? "method not allowed" : "not found" }, known ? 405 : 404);
  }
  try {
    return await handler(request, env, url);
  } catch (err) {
    console.error("api error", url.pathname, err);
    return json({ error: "temporarily unavailable" }, 503);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    // run_worker_first only sends /api/* here, but serve assets for anything else just in case.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<AuthEnv & AdminEnv>;
