# 001 — Scaffold Astro and deploy to Cloudflare

**Status:** todo · **Plan:** [Plan 0001](../plans/0001-events-site.md) · **Depends on:** —

## Goal

Get an empty Astro site building and live on Cloudflare, so every later task ships straight to a URL.

## Done when

- [ ] Astro 7 project at the repo root (`src/`, `public/`, `astro.config.mjs`), static output, TypeScript strict
- [ ] `wrangler.jsonc` serving `./dist` as static assets, custom 404
- [ ] `npm run dev`, `npm run build`, `npm run preview`, `npm run deploy` work
- [ ] `.github/workflows/deploy.yml`: `wrangler deploy` on push to `main`; `wrangler versions upload` with the preview URL in the run summary on pull requests; callable through `workflow_call`
- [ ] The workflow reads the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets
- [ ] The site is live on its Cloudflare URL
- [ ] `.gitignore` covers `node_modules/`, `dist/`, `.wrangler/`
- [ ] README and CLAUDE.md updated with the commands

## Notes

No Cloudflare adapter needed while everything is static. Needs the two repository secrets from the user before the first deploy.
