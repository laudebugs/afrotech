// Site-wide settings.

/** Where questions and speaker change requests go. The GitHub repo is
 *  archived, so it no longer takes issues. */
export const CONTACT_EMAIL = "laudebugs@gmail.com";

export const SITE_URL = "https://afrotech26.laudebugs.me";

/** Google sign-in (plan 0002). Public by design; also in wrangler.jsonc for the Worker. */
export const GOOGLE_CLIENT_ID = "316564590500-t9tgifb1fhjool4mhfi6dp93pbug1n0j.apps.googleusercontent.com";

/** Google only accepts sign-ins from origins listed on the client. */
export const SIGN_IN_HOSTS = ["afrotech26.laudebugs.me", "localhost"];
