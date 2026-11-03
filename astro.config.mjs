// @ts-check
import { defineConfig } from "astro/config";

// Static output: every page is built ahead of time and Cloudflare serves the files.
export default defineConfig({
  site: "https://afrotech26.laudebugs.me",
  output: "static",
  trailingSlash: "ignore",
});
