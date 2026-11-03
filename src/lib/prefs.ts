// Per-device preferences in localStorage. Storage can be blocked or throw
// (private windows, strict settings), so every access falls back quietly.
export type ThemePref = "system" | "light" | "dark";
export type Prefs = { theme: ThemePref };

const KEY = "afrotech:prefs";
const DEFAULTS: Prefs = { theme: "system" };

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    const theme = parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system";
    return { ...DEFAULTS, theme };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writePrefs(update: Partial<Prefs>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...update }));
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}
