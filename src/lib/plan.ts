// My plan: the starred event ids, kept in localStorage. Storage can be blocked
// (private windows, strict settings); then the plan lives in memory for the page.
const KEY = "afrotech:plan";
let memory: string[] | null = null;

// Signed-in sync (todo 016): each star or unstar is logged with its time, so
// the server can keep the latest change per event. Signed out, the log is
// simply never sent.
const CHANGES_KEY = "afrotech:plan-changes";
export type PlanChange = { starred: boolean; updatedAt: number };
let memoryChanges: Record<string, PlanChange> | null = null;

export function readChanges(): Record<string, PlanChange> {
  if (memoryChanges) return { ...memoryChanges };
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CHANGES_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, PlanChange>) : {};
  } catch {
    return {};
  }
}

function writeChanges(changes: Record<string, PlanChange>): void {
  try {
    localStorage.setItem(CHANGES_KEY, JSON.stringify(changes));
    memoryChanges = null;
  } catch {
    memoryChanges = changes;
  }
}

function logChange(id: string, starred: boolean): void {
  writeChanges({ ...readChanges(), [id]: { starred, updatedAt: Date.now() } });
}

/** Drops logged changes the server has now seen (unless they changed again since). */
export function forgetSentChanges(sent: Record<string, PlanChange>): void {
  const current = readChanges();
  for (const [id, change] of Object.entries(sent)) {
    if (current[id] && current[id].updatedAt <= change.updatedAt) delete current[id];
  }
  writeChanges(current);
}

export function readPlan(): string[] {
  if (memory) return [...memory];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function save(ids: string[], source: "local" | "sync" = "local"): void {
  const unique = [...new Set(ids)];
  try {
    localStorage.setItem(KEY, JSON.stringify(unique));
    memory = null;
  } catch {
    memory = unique;
  }
  document.dispatchEvent(new CustomEvent("plan-change", { detail: { ids: unique, source } }));
}

/** Replaces the plan with the synced result, without logging it as new changes. */
export function applySyncedPlan(ids: string[]): void {
  const current = readPlan();
  const same = current.length === ids.length && ids.every((id) => current.includes(id));
  if (!same) save(ids, "sync");
}

export const inPlan = (id: string) => readPlan().includes(id);

/** Adds or removes one event; returns whether it is now in the plan. */
export function togglePlan(id: string): boolean {
  const ids = readPlan();
  const on = !ids.includes(id);
  logChange(id, on);
  save(on ? [...ids, id] : ids.filter((x) => x !== id));
  return on;
}

export function addToPlan(newIds: string[]): void {
  const current = readPlan();
  for (const id of newIds) if (!current.includes(id)) logChange(id, true);
  save([...current, ...newIds]);
}

/** Replaces the whole plan, e.g. to drop ids of events that no longer exist. */
export function setPlan(ids: string[]): void {
  save(ids);
}

/** Another tab changed the plan: tell this page. */
export function watchOtherTabs(): void {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      document.dispatchEvent(new CustomEvent("plan-change", { detail: { ids: readPlan(), source: "tab" } }));
    }
  });
}
