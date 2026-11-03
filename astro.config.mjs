// @ts-check
import { defineConfig } from "astro/config";
import { execSync } from "node:child_process";
import serviceWorker from "./integrations/service-worker.mjs";

// The commit time stamps "Schedule updated …" (src/lib/build-info.ts); the
// build time stands in when git isn't available.
function commitTime() {
  try {
    return execSync("git log -1 --format=%cI", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return new Date().toISOString();
  }
}

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
  vite: {
    define: { "import.meta.env.PUBLIC_UPDATED_AT": JSON.stringify(commitTime()) },
  },
});
