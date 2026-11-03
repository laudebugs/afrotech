# 001 — Scaffold Astro and deploy to Cloudflare

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** —

## Goal

Get an empty Astro site building and live on Cloudflare, so every later task ships straight to a URL.

## Done when

- [ ] Astro 7 project at the repo root (`src/`, `public/`, `astro.config.mjs`), static output, TypeScript strict
- [ ] `wrangler.jsonc` serving `./dist` as static assets, custom 404
- [ ] `npm run dev`, `npm run build`, `npm run preview`, `npm run deploy` work
- [ ] Workers Builds settings written down in the README: build `npm run build`, deploy `npx wrangler deploy`, production branch `main`
- [ ] You connect the repo in the Cloudflare dashboard (Workers & Pages → Create → Import a repository)
- [ ] `wrangler.jsonc` attaches the custom domain `afrotech26.laudebugs.me`
- [ ] The site is live at https://afrotech26.laudebugs.me
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `.wrangler/`
- [ ] README and CLAUDE.md updated with the commands

## Notes

No Cloudflare adapter needed while everything is static. Cloudflare holds the deploy credentials; the repo needs no secrets.
