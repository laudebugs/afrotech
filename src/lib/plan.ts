// My plan: the starred event ids, kept in localStorage. Storage can be blocked
// (private windows, strict settings); then the plan lives in memory for the page.
const KEY = "afrotech:plan";
let memory: string[] | null = null;

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

function save(ids: string[]): void {
  const unique = [...new Set(ids)];
  try {
    localStorage.setItem(KEY, JSON.stringify(unique));
    memory = null;
  } catch {
    memory = unique;
  }
  document.dispatchEvent(new CustomEvent("plan-change", { detail: unique }));
}

export const inPlan = (id: string) => readPlan().includes(id);

/** Adds or removes one event; returns whether it is now in the plan. */
export function togglePlan(id: string): boolean {
  const ids = readPlan();
  const on = !ids.includes(id);
  save(on ? [...ids, id] : ids.filter((x) => x !== id));
  return on;
}

export function addToPlan(newIds: string[]): void {
  save([...readPlan(), ...newIds]);
}

/** Replaces the whole plan, e.g. to drop ids of events that no longer exist. */
export function setPlan(ids: string[]): void {
  save(ids);
}

/** Another tab changed the plan: tell this page. */
export function watchOtherTabs(): void {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) document.dispatchEvent(new CustomEvent("plan-change", { detail: readPlan() }));
  });
}
