// The site's only server code (plan 0002). Cloudflare sends /api/* here
// (`run_worker_first` in wrangler.jsonc); every other request is a static file.
import { currentUser, type Env } from "./session";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

type Handler = (request: Request, env: Env, url: URL) => Promise<Response>;

/** Routes by "METHOD /path". Later todos add sign-in and plan sync here. */
const routes: Record<string, Handler> = {
  "GET /api/me": async (request, env) => {
    const user = await currentUser(request, env);
    return json(user ? { signedIn: true, name: user.name, pictureUrl: user.pictureUrl } : { signedIn: false });
  },
};

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
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
} satisfies ExportedHandler<Env>;
