// /search-index.json: what the week-wide search needs (plan 0009). The search
// page fetches it, and the service worker saves it for offline use.
import type { APIRoute } from "astro";
import { buildSearchIndex } from "../lib/search-index";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex()), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
