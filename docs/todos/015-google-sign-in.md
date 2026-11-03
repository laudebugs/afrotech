# 015 — Google sign-in and sessions

**Status:** waiting on you · **Plan:** [Plan 0002](../plans/0002-google-sign-in.md) · **Depends on:** 014

## Goal

Sign in with Google's button; the Worker checks the ID token and keeps a session.

## Done when

- [ ] Google Identity Services button on My plan
- [ ] `POST /api/auth/google` checks the token with `jose` (signature, issuer, audience, expiry)
- [ ] Sessions: random token, hashed in D1, `__Host-session` cookie (HttpOnly, Secure, SameSite=Lax, 30 days)
- [ ] `POST /api/auth/signout`; rate limit on sign-in; Origin check on writes
- [ ] CLAUDE.md's "No sign-in" rule becomes "sign-in is optional"

## Notes

**Waiting on you:** the Google OAuth client ID.
