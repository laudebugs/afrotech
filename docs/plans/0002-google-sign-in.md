# Plan 0002: Optional Google sign-in keeps My plan in step across devices

**Status:** approved 2026-11-03; todos 014–015 wait on your Google client ID and D1 database ID · **Created:** 2026-11-03

My plan lives in one browser's `localStorage`. Star a session on your phone and
it's missing on your laptop; clear the browser's data and the plan is gone. The
share link copies a plan once, but it doesn't keep two devices in step. This plan
adds an optional "Sign in with Google": once signed in, your stars sync through
a small Cloudflare Worker and database, while the site keeps working exactly as
it does today for anyone who never signs in.

## Signing in stays optional, and the site works without it

People who never sign in see no change: stars save on the device, the share
link and calendar export still work, and nothing waits on the network. Signing
in adds three things:

1. **Sync.** A star on one device appears on your others within seconds of
   their next visit, and an unstar removes it everywhere.
2. **A safe first sign-in.** Stars already on the device merge with any saved
   plan, so nothing is lost.
3. **Control.** "Sign out" and "Delete my data" sit beside the sign-in button
   on the My plan page.

Note drafts stay on the device in version 1; question 2 at the end asks whether
to sync them too.

## Google's sign-in button hands our Worker a token it can check

The site uses Google Identity Services, Google's own sign-in button. When you
tap it, Google returns a signed ID token naming your account. Five steps follow:

1. The page posts the token to `/api/auth/google`.
2. The Worker checks the token's signature against Google's published keys with
   the `jose` library, and checks its issuer, audience (our client ID) and
   expiry, as [Google's verification guide](https://developers.google.cn/identity/gsi/web/guides/verify-google-id-token?hl=en)
   describes.
3. The Worker finds or creates your account by the token's `sub` claim, the
   stable Google account id that Google recommends as the key.
4. The Worker creates a session: a random 32-byte token, stored only as a
   SHA-256 hash, and sent back as a cookie named `__Host-session` that is
   `HttpOnly`, `Secure` and `SameSite=Lax`, lasting 30 days.
5. The page reloads its plan from the server and merges.

This flow asks Google only for your name, email and picture. It needs no client
secret, keeps no Google access token and calls no Google API on your behalf,
which makes it simpler and safer than a full OAuth redirect.

## One small Worker sits beside the static site

The Astro site stays static. A Worker script joins it in `wrangler.jsonc`
(`main: "worker/index.ts"`), and Cloudflare's `run_worker_first` setting sends
only `/api/*` requests to the Worker
([Cloudflare docs](https://docs.cloudflare.com/workers/static-assets/binding/)).
Every page and asset still comes straight from the static files.

| Route | Does |
|-------|------|
| `POST /api/auth/google` | Checks the ID token, signs you in, sets the cookie |
| `POST /api/auth/signout` | Ends the session and clears the cookie |
| `GET /api/me` | Your name and picture, or "signed out" |
| `GET /api/plan` | Your saved stars |
| `POST /api/plan` | Applies your changes and returns the merged plan |
| `DELETE /api/me` | Deletes your account, sessions and plan |

## Three D1 tables hold accounts, sessions and stars

Cloudflare D1 is a small SQL database that Workers reach through a binding.

| Table | Columns |
|-------|---------|
| `users` | `id`, `google_sub` (unique), `email`, `name`, `picture_url`, `created_at` |
| `sessions` | `token_hash` (key), `user_id`, `created_at`, `expires_at` |
| `plan_items` | `user_id`, `event_id`, `starred` (1 or 0), `updated_at`; key `(user_id, event_id)` |

Migrations live in `worker/migrations/`, and the Cloudflare deploy command runs
them before each deploy.

## Each star syncs on its own, and the latest change wins

The browser keeps a short log of your changes, each with a timestamp. A sync
sends the log, the server keeps each change only if it's newer than the one it
holds, and the server answers with your whole plan. An unstar is stored as
`starred = 0` rather than deleted, so a removal reaches your other devices
instead of being undone by them.

Syncs run when a page loads, about a second after you star or unstar, and when
you return to the tab. Offline changes wait in the log until the next sync, so
the site stays usable on bad Wi-Fi.

## Security and privacy follow from a few rules

- **Cookies:** only the session cookie, with `HttpOnly`, `Secure` and
  `SameSite=Lax`. Changes to data also require a same-origin `Origin` header
  and a JSON body, which blocks cross-site form posts.
- **Stored data:** your Google `sub`, email, name, picture URL and stars.
  Nothing else, and no Google tokens.
- **Deletion:** "Delete my data" removes the account, sessions and stars at
  once. A new `/privacy` page explains all of this in plain words.
- **Abuse:** Cloudflare's rate-limiting binding caps sign-in attempts per IP.
- **Preview builds:** Google only accepts sign-ins from origins listed on the
  client, and preview URLs change with every build. So sign-in works on
  `afrotech26.laudebugs.me` and on `localhost`. Previews show a short note
  instead of the button.

## Two setup steps need your accounts

1. **Google Cloud:** create an OAuth client of type *Web application*, with an
   *External* consent screen (app name, support email, the `/privacy` link).
   Add `https://afrotech26.laudebugs.me`, `http://localhost:4321` and
   `http://localhost:8787` as authorized JavaScript origins, then send me the
   **client ID**. It's public by design; no secret is involved.
2. **Cloudflare:** create a D1 database named `afrotech` (dashboard, or
   `npx wrangler d1 create afrotech`) and send me its **database ID**, or let me
   add the command to the deploy step.

## This plan replaces the "no sign-in" decision

Plan 0001 and `CLAUDE.md` say the site has no sign-in. On approval, both change
to "sign-in is optional; signed-out use is unchanged". Publishing notes still
goes through GitHub.

## Four proposed todos

| # | Task |
|---|------|
| 014 | Worker and D1 skeleton: `wrangler.jsonc`, migrations, `/api/me`, local dev with `wrangler dev` |
| 015 | Google sign-in: token check, sessions, sign-out, rate limit |
| 016 | Plan sync: change log, merge on first sign-in, background syncs |
| 017 | Account controls on My plan, `/privacy`, "Delete my data" |

## Risks

| Risk | Response |
|------|----------|
| The work takes about a day, and the conference ends Friday | Signed-out use is unaffected, so each todo ships on its own and nothing breaks if it lands late. |
| D1 or the Worker is down | The site is local-first: stars keep saving on the device and sync later. |
| A device's clock is wrong | The latest-change rule could pick the older star. For one person's plan the effect is small; the server can clamp timestamps from the future. |
| Google changes its sign-in button | The Worker only depends on the ID token format, which Google documents and keeps stable. |

## Decided, and three decisions left

On November 3 you approved optional Google sign-in in place of the "no sign-in"
rule. `CLAUDE.md` changes when todo 015 ships sign-in, so it keeps describing
the site as it is.

Three questions remain before building starts:

1. **Sync note drafts too**, or stars only? I recommend stars only for now.
2. **Setup:** will you create the Google client and the D1 database, using the
   steps above?
3. **Timing:** build it this week, or keep it for AfroTech 2027?

Once you answer these, todo 014 starts the Worker, and each later todo ships
on its own.
