// When the site's content last changed: the time of the commit being built
// (data refreshes are commits), set in astro.config.mjs. Using the commit keeps
// rebuilds of the same commit identical, so phones don't update for nothing.
const iso: string | undefined = import.meta.env.PUBLIC_UPDATED_AT;
const parsed = iso ? new Date(iso) : null;

export const UPDATED_AT: Date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
