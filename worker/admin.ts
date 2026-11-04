// The admin dashboard's data (plan 0011). Only accounts whose email is in
// ADMIN_EMAILS (wrangler.jsonc) get an answer; everyone else gets "not found".
//
// Everything here is a total. Nothing returns a name, an email or a note's
// text, and the "top" lists keep only sessions that at least MIN_GROUP
// accounts share, so no list points at one person.
import type { SignedInUser } from "./session";
import { HOUSTON_OFFSET_MS, houstonDate } from "../src/lib/admin";

export type AdminEnv = Env & {
  /** A Cloudflare API token that can read analytics for the site's zone (a secret). */
  CF_ANALYTICS_TOKEN?: string;
};

/** Houston's offset this week (CST) for SQLite's date(); days are counted in Houston time. */
const HOUSTON = "-6 hours";
/** A "top" list leaves out anything fewer accounts than this share. */
export const MIN_GROUP = 3;

/** The admin emails from the secret, lower-cased. */
export function adminEmails(secret: string | undefined): Set<string> {
  return new Set(
    (secret ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Whether this signed-in account may see the dashboard. */
export async function isAdmin(env: AdminEnv, user: SignedInUser | null): Promise<boolean> {
  if (!user) return false;
  const admins = adminEmails(env.ADMIN_EMAILS);
  if (admins.size === 0) return false;
  const row = await env.DB.prepare("SELECT email FROM users WHERE id = ?1").bind(user.id).first<{ email: string | null }>();
  return !!row?.email && admins.has(row.email.toLowerCase());
}

type Day = { day: string; n: number };
type Count = { n: number };

/** Account, plan, note and photo totals from D1. */
export async function readMetrics(env: Env) {
  const now = new Date().toISOString();
  const db = env.DB;
  const one = (sql: string, ...args: unknown[]) => db.prepare(sql).bind(...args);
  const [
    accounts,
    signedIn,
    newPerDay,
    activePerDay,
    starAccounts,
    stars,
    starsPerDay,
    topStarred,
    noteAccounts,
    notes,
    notesPerDay,
    topNoted,
    photos,
  ] = await db.batch([
    one("SELECT COUNT(*) AS n FROM users"),
    one("SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE expires_at > ?1", now),
    one(`SELECT date(created_at, '${HOUSTON}') AS day, COUNT(*) AS n FROM users GROUP BY day ORDER BY day`),
    // Accounts that starred or wrote something that day, by the device's time.
    one(
      `SELECT day, COUNT(DISTINCT user_id) AS n FROM (
         SELECT user_id, date(updated_at / 1000, 'unixepoch', '${HOUSTON}') AS day FROM plan_items
         UNION ALL
         SELECT user_id, date(updated_at / 1000, 'unixepoch', '${HOUSTON}') AS day FROM notes
       ) GROUP BY day ORDER BY day`,
    ),
    one("SELECT COUNT(DISTINCT user_id) AS n FROM plan_items WHERE starred = 1"),
    one("SELECT COUNT(*) AS n FROM plan_items WHERE starred = 1"),
    one(
      `SELECT date(updated_at / 1000, 'unixepoch', '${HOUSTON}') AS day, COUNT(*) AS n
         FROM plan_items WHERE starred = 1 GROUP BY day ORDER BY day`,
    ),
    one(
      `SELECT event_id AS id, COUNT(*) AS n FROM plan_items WHERE starred = 1
        GROUP BY event_id HAVING n >= ?1 ORDER BY n DESC, event_id LIMIT 10`,
      MIN_GROUP,
    ),
    one("SELECT COUNT(DISTINCT user_id) AS n FROM notes WHERE deleted = 0"),
    one("SELECT COUNT(*) AS n FROM notes WHERE deleted = 0"),
    one(
      `SELECT date(created_at / 1000, 'unixepoch', '${HOUSTON}') AS day, COUNT(*) AS n
         FROM notes WHERE deleted = 0 GROUP BY day ORDER BY day`,
    ),
    one(
      `SELECT event_id AS id, COUNT(DISTINCT user_id) AS n FROM notes WHERE deleted = 0 AND event_id != ''
        GROUP BY event_id HAVING n >= ?1 ORDER BY n DESC, event_id LIMIT 10`,
      MIN_GROUP,
    ),
    one("SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM photos"),
  ]);
  const n = (r: D1Result) => (r.results[0] as Count | undefined)?.n ?? 0;
  const days = (r: D1Result) => (r.results as Day[]).filter((d) => d.day);
  return {
    at: Date.now(),
    accounts: { total: n(accounts!), signedIn: n(signedIn!), newPerDay: days(newPerDay!), activePerDay: days(activePerDay!) },
    plan: {
      accounts: n(starAccounts!),
      stars: n(stars!),
      perDay: days(starsPerDay!),
      top: topStarred!.results as { id: string; n: number }[],
    },
    notes: {
      accounts: n(noteAccounts!),
      notes: n(notes!),
      perDay: days(notesPerDay!),
      top: topNoted!.results as { id: string; n: number }[],
    },
    photos: {
      count: n(photos!),
      bytes: (photos!.results[0] as { bytes?: number } | undefined)?.bytes ?? 0,
    },
    minGroup: MIN_GROUP,
  };
}

// ---- Page traffic from Cloudflare's analytics (todo 042) ----

const CF_API = "https://api.cloudflare.com/client/v4";
/** Days of traffic to show, newest last. Cloudflare's free plan keeps about a week. */
const TRAFFIC_DAYS = 7;

let zoneTag: string | null = null;

async function cf(env: AdminEnv, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, "Content-Type": "application/json" },
  });
  const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] | null } | null;
  if (!res.ok || !body) throw new Error(body?.errors?.[0]?.message ?? `Cloudflare answered ${res.status}`);
  return body;
}

/** The zone id for ANALYTICS_ZONE, looked up once per Worker instance. */
async function findZone(env: AdminEnv): Promise<string> {
  if (zoneTag) return zoneTag;
  const body = (await cf(env, `/zones?name=${encodeURIComponent(env.ANALYTICS_ZONE)}`)) as { result?: { id: string }[] };
  const id = body.result?.[0]?.id;
  if (!id) throw new Error(`the token can't see the zone ${env.ANALYTICS_ZONE}`);
  zoneTag = id;
  return id;
}

/** The Houston day `back` days before today, as UTC start and end times. */
export function houstonDay(now: number, back: number): { day: string; start: string; end: string } {
  const day = houstonDate(now, back);
  const start = new Date(Date.parse(`${day}T00:00:00Z`) + HOUSTON_OFFSET_MS);
  return { day, start: start.toISOString(), end: new Date(start.getTime() + 86_400_000).toISOString() };
}

type Group = { count: number; sum?: { visits?: number }; dimensions?: Record<string, string> };

/** One day's page views (HTML responses to people, not bots' or our own fetches). */
const DAY_QUERY = `query ($zone: String!, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      total: httpRequestsAdaptiveGroups(filter: $filter, limit: 1) { count sum { visits } }
      pages: httpRequestsAdaptiveGroups(filter: $filter, limit: 100, orderBy: [count_DESC]) {
        count dimensions { clientRequestPath }
      }
      countries: httpRequestsAdaptiveGroups(filter: $filter, limit: 50, orderBy: [count_DESC]) {
        count dimensions { clientCountryName }
      }
      devices: httpRequestsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [count_DESC]) {
        count dimensions { clientDeviceType }
      }
    }
  }
}`;

type DayResult = { total: Group[]; pages: Group[]; countries: Group[]; devices: Group[] };

async function trafficDay(env: AdminEnv, zone: string, start: string, end: string): Promise<DayResult> {
  const filter = {
    datetime_geq: start,
    datetime_lt: end,
    clientRequestHTTPHost: env.ANALYTICS_HOST,
    edgeResponseContentTypeName: "html",
    requestSource: "eyeball",
  };
  const body = (await cf(env, "/graphql", {
    method: "POST",
    body: JSON.stringify({ query: DAY_QUERY, variables: { zone, filter } }),
  })) as { data?: { viewer?: { zones?: DayResult[] } } | null; errors?: { message?: string }[] | null };
  if (body.errors?.length) throw new Error(body.errors[0]?.message ?? "Cloudflare's analytics refused the query");
  const result = body.data?.viewer?.zones?.[0];
  if (!result) throw new Error("no analytics for the zone");
  return result;
}

/** Adds up count by one dimension across days, biggest first. */
function tally(groups: Group[], key: string, limit: number): { name: string; n: number }[] {
  const by = new Map<string, number>();
  for (const g of groups) {
    const name = g.dimensions?.[key] || "Unknown";
    by.set(name, (by.get(name) ?? 0) + g.count);
  }
  return [...by].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).slice(0, limit);
}

/** Page views per day for the last week, plus top pages, countries and devices. */
export async function readTraffic(env: AdminEnv) {
  if (!env.CF_ANALYTICS_TOKEN) return { configured: false as const };
  const zone = await findZone(env);
  const now = Date.now();
  const wanted = Array.from({ length: TRAFFIC_DAYS }, (_, i) => houstonDay(now, TRAFFIC_DAYS - 1 - i));
  // Each day is its own query: the free plan limits how long a range one query
  // may cover. A day past the plan's retention fails alone and is left out.
  const results = await Promise.allSettled(wanted.map((d) => trafficDay(env, zone, d.start, d.end)));
  const days: { day: string; views: number; visits: number }[] = [];
  const all: DayResult = { total: [], pages: [], countries: [], devices: [] };
  let firstError: string | null = null;
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      firstError ??= r.reason instanceof Error ? r.reason.message : String(r.reason);
      return;
    }
    const t = r.value.total[0];
    days.push({ day: wanted[i]!.day, views: t?.count ?? 0, visits: t?.sum?.visits ?? 0 });
    all.pages.push(...r.value.pages);
    all.countries.push(...r.value.countries);
    all.devices.push(...r.value.devices);
  });
  if (days.length === 0) throw new Error(firstError ?? "no traffic data");
  return {
    configured: true as const,
    at: now,
    from: wanted[0]!.day,
    to: wanted[wanted.length - 1]!.day,
    days,
    pages: tally(all.pages, "clientRequestPath", 10),
    countries: tally(all.countries, "clientCountryName", 8),
    devices: tally(all.devices, "clientDeviceType", 4),
    /** Days whose query failed (usually past Cloudflare's retention). */
    missing: wanted.length - days.length,
  };
}
