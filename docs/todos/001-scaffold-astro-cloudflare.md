# 001 — Scaffold Astro and deploy to Cloudflare

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** —

## Goal

Get an empty Astro site building and live on Cloudflare, so every later task ships straight to a URL.

## Done when

- [ ] Astro 7 project at the repo root (`src/`, `public/`, `astro.config.mjs`), static output, TypeScript strict
- [ ] `wrangler.jsonc` serving `./dist` as static assets, custom 404
- [ ] `npm run dev`, `npm run build`, `npm run preview`, `npm run deploy` work
- [ ] Deployed to a Cloudflare URL (Workers Builds from GitHub, or `wrangler deploy`)
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `.wrangler/`
- [ ] README and CLAUDE.md updated with the commands

## Notes

No Cloudflare adapter needed while everything is static. Needs the user's Cloudflare account — see open question 2 in the plan.
