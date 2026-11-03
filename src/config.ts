// Site-wide settings.

/** Shown as the author of every note. */
export const SITE_AUTHOR = "laudebugs";

/** Where notes are published: GitHub's "new file" page writes into this repo. */
export const NOTES_REPO = { owner: "laudebugs", repo: "afrotech", branch: "main", dir: "notes" };

export const SITE_URL = "https://afrotech26.laudebugs.me";

/** Google sign-in (plan 0002). Public by design; also in wrangler.jsonc for the Worker. */
export const GOOGLE_CLIENT_ID = "316564590500-t9tgifb1fhjool4mhfi6dp93pbug1n0j.apps.googleusercontent.com";

/** Google only accepts sign-ins from origins listed on the client. */
export const SIGN_IN_HOSTS = ["afrotech26.laudebugs.me", "localhost"];
