# 017 — Account controls and privacy page

**Status:** done · **Plan:** [Plan 0002](../plans/0002-google-sign-in.md) · **Depends on:** 015

## Goal

Give signed-in people control over their data, and explain it plainly.

## Done when

- [x] Signed-in state on My plan: name, picture, Sign out
- [x] "Delete my data" calls `DELETE /api/me` and clears the account, sessions and stars
- [x] `/privacy` page: what's stored, why, and how to delete it
- [x] Preview builds show a note instead of the sign-in button

Built on November 3, alongside todo 015:

- **Panel:** My plan shows Google's button when signed out, and your name and
  picture with **Sign out** and **Delete my data** when signed in.
- **Deleting:** `DELETE /api/me` removes the account, its sessions and its saved
  plan, and clears the cookie. The device keeps its own copy of the plan.
- **`/privacy`:** what's stored and why, how to delete it, that location never
  leaves the device, how speaker profiles are made, and that the site isn't
  affiliated with AfroTech or Blavity.
- **Tested** in a browser: the signed-out panel with Google's button, the
  signed-in panel after a test sign-in, and Delete my data returning to signed
  out with the sync hint cleared.
