# 001 — Scaffold Astro and deploy to Cloudflare

**Status:** done · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** —

## Goal

Get an empty Astro site building and live on Cloudflare, so every later task ships straight to a URL.

## Done when

- [x] Astro 7 project at the repo root (`src/`, `public/`, `astro.config.mjs`), static output, TypeScript strict
- [x] `wrangler.jsonc` serving `./dist` as static assets, custom 404
- [x] `npm run dev`, `npm run build` and `npm run preview` work
- [ ] `npm run deploy` works (needs `wrangler login`, so untested here; `wrangler deploy --dry-run` passes)
- [x] Workers Builds settings written down in the README: build `npm run build`, deploy `npx wrangler deploy`, production branch `main`
- [x] You connect the repo in the Cloudflare dashboard (Workers & Pages → Create → Import a repository)
- [x] `wrangler.jsonc` attaches the custom domain `afrotech26.laudebugs.me`
- [x] The site is live at https://afrotech26.laudebugs.me
- [x] `.gitignore` covers `node_modules/`, `dist/`, `.wrangler/`
- [x] README and CLAUDE.md updated with the commands

## Notes

No Cloudflare adapter needed while everything is static. Cloudflare holds the deploy credentials; the repo needs no secrets.

`npm run deploy` exists for manual deploys but needs a local `wrangler login`;
Cloudflare's own builds are the normal path. `npm run build` also runs
`astro check`, so type errors stop a deploy. The home page is a placeholder that
links to the schedules on GitHub until todo 004 lands.
