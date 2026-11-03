// AfroTech 2026 Planner service worker (plan 0004, todo 013).
// integrations/service-worker.mjs fills in BUILD and PRECACHE after each build
// and writes the result to dist/sw.js. Edit this template, not dist/sw.js.
const BUILD = "__BUILD__";
const PRECACHE = __PRECACHE__;

const CORE = `core-${BUILD}`; // pages and files saved up front, per build
const PAGES = "pages"; // event pages and calendar files saved as you go
const OFFLINE = "/offline/";
const NETWORK_TIMEOUT = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE);
      // One failed file shouldn't stop the rest from saving.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      // Old builds' caches go. Saved event pages go too, because they point at
      // the old build's styles; pages re-save starred events on their next load.
      await Promise.all(names.filter((n) => n !== CORE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

// Our files don't vary by origin, but some servers send "Vary: Origin", and
// module scripts send an Origin header that the precache didn't. Ignore Vary
// so those lookups still hit.
const match = (request, options = {}) => caches.match(request, { ignoreVary: true, ...options });

/** The saved copy, ignoring query strings such as ?kind=side. */
const saved = (request) => match(request, { ignoreSearch: true });

async function put(cacheName, request, response) {
  if (response && response.ok && response.type === "basic") {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

/** Pages: the network when it answers within 3 seconds, else the saved copy. */
async function networkFirst(event) {
  const request = event.request;
  const network = fetch(request).then((res) => put(PAGES, request, res));
  // Keep the cache write alive even if the saved copy wins the race.
  event.waitUntil(network.catch(() => undefined));
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT, "timeout"));
  try {
    const first = await Promise.race([network, timeout]);
    if (first !== "timeout") return first;
    return (await saved(request)) ?? (await network);
  } catch {
    return (await saved(request)) ?? (await match(OFFLINE)) ?? Response.error();
  }
}

/** Hashed files never change, so a saved copy is always right. */
async function cacheFirst(request) {
  return (await match(request)) ?? put(CORE, request, await fetch(request));
}

/** Event pages and .ics files: answer from the cache, refresh in the background. */
async function staleWhileRevalidate(event) {
  const cached = await saved(event.request);
  const fresh = fetch(event.request)
    .then((res) => put(PAGES, event.request, res))
    .catch(() => undefined);
  event.waitUntil(fresh);
  return cached ?? (await fresh) ?? (await match(OFFLINE)) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // sign-in and sync handle offline themselves

  if (url.pathname.startsWith("/_astro/")) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith("/event/") && request.mode !== "navigate") {
    event.respondWith(staleWhileRevalidate(event)); // the sheet's fetches and .ics files
  } else if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(event));
  }
});

// Pages send the starred event ids, so their pages and calendar files open offline.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "save-events" || !Array.isArray(data.ids)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES);
      const urls = data.ids
        .filter((id) => typeof id === "string" && /^[\w-]+$/.test(id))
        .flatMap((id) => [`/event/${id}/`, `/event/${id}.ics`]);
      await Promise.allSettled(
        urls.map(async (url) => {
          if (!(await cache.match(url, { ignoreVary: true }))) await cache.add(url);
        }),
      );
    })(),
  );
});
