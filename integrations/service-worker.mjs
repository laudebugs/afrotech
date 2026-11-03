// Writes dist/sw.js after each build: the template in src/sw/ plus the build's
// precache list and a build id that changes only when the template or a
// precached file does.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Pages saved up front (plan 0004): Now, every day, My plan and the rest of the tabs. */
const CORE_PAGES = ["/", "/schedule/", "/plan/", "/notes/", "/speakers/", "/map/", "/offline/"];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return files.flat();
}

export default function serviceWorker() {
  return {
    name: "afrotech-service-worker",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = await walk(out);
        const url = (file) => "/" + relative(out, file).split(sep).join("/");

        // Hashed CSS, JS and woff2 fonts (the woff fallbacks are for old browsers).
        const assets = files.filter((f) => /\/_astro\/.+\.(css|js|woff2)$/.test(url(f))).map(url);
        // Every day's schedule page.
        const days = files
          .map(url)
          .filter((u) => /^\/schedule\/\d{4}-\d{2}-\d{2}\/index\.html$/.test(u))
          .map((u) => u.replace("index.html", ""));
        const pageFile = (page) => join(out, page, "index.html");
        const pages = [...CORE_PAGES, ...days].filter((p) => files.includes(pageFile(p)));
        const precache = [...pages, ...assets].sort();

        const template = await readFile(new URL("../src/sw/sw.template.js", import.meta.url), "utf8");
        // The id changes when the worker's code or any saved file changes, and only then.
        const hash = createHash("sha256").update(template);
        for (const u of precache) {
          const file = u.endsWith("/") ? pageFile(u) : join(out, u);
          hash.update(u).update(await readFile(file));
        }
        const build = hash.digest("hex").slice(0, 12);
        const sw = template
          .replace('"__BUILD__"', JSON.stringify(build))
          .replace("__PRECACHE__", JSON.stringify(precache, null, 2));
        await writeFile(join(out, "sw.js"), sw);
        logger.info(`sw.js: build ${build}, ${pages.length} pages and ${assets.length} files to precache`);
      },
    },
  };
}
