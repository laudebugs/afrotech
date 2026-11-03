// @ts-check
import { defineConfig } from "astro/config";
import serviceWorker from "./integrations/service-worker.mjs";

// Static output: every page is built ahead of time and Cloudflare serves the files.
export default defineConfig({
  site: "https://afrotech26.laudebugs.me",
  output: "static",
  trailingSlash: "ignore",
  // Start fetching a page the moment a finger or mouse goes down on its link
  // (works on phones too). The light Schedule and Map tabs prefetch as soon as
  // they're on screen; see AppNav.
  prefetch: { prefetchAll: true, defaultStrategy: "tap" },
  // Writes dist/sw.js for offline use (plan 0004).
  integrations: [serviceWorker()],
});
