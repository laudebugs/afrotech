// @ts-check
import { defineConfig } from "astro/config";

// Static output: every page is built ahead of time and Cloudflare serves the files.
export default defineConfig({
  site: "https://afrotech26.laudebugs.me",
  output: "static",
  trailingSlash: "ignore",
  // Fetch pages ahead of the tap: links on hover or focus, and the four tabs
  // (marked data-astro-prefetch="viewport") as soon as they're on screen.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
});
