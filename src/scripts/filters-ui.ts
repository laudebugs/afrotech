// Wires up Filters.astro (plan 0009, todo 038). The filters live in the
// address, so links, back and forward keep them. The page says how many
// events match, for the sheet's "Show N events" button.
import { NO_FILTERS, activeCount, readFilters, writeFilters, type Filters } from "../lib/filters";

export type FiltersUi = { get: () => Filters; set: (f: Filters) => void; refreshCount: () => void };

export function initFilters(opts: { count: (f: Filters) => number; onChange: (f: Filters) => void }): FiltersUi {
  const root = document.querySelector<HTMLElement>("[data-filters]")!;
  const sheet = document.querySelector<HTMLDialogElement>("#filters-sheet")!;
  const chips = [...document.querySelectorAll<HTMLButtonElement>("[data-filters] [data-set], #filters-sheet [data-set]")];
  const track = document.querySelector<HTMLSelectElement>("#filters-sheet [data-track]")!;
  const badge = root.querySelector<HTMLElement>("[data-filter-count]")!;
  const show = document.querySelector<HTMLButtonElement>("[data-show-results]")!;

  let state = readFilters(new URLSearchParams(location.search));

  function paint() {
    for (const chip of chips) {
      const [key, value] = chip.dataset.set!.split("=") as [keyof Filters, string];
      const current = state[key];
      chip.setAttribute("aria-pressed", String(value === "1" ? current === true : current === value));
    }
    track.value = state.track;
    const n = activeCount(state);
    badge.textContent = String(n);
    badge.hidden = n === 0;
    refreshCount();
  }

  function refreshCount() {
    const n = opts.count(state);
    show.textContent = n === 1 ? "Show 1 event" : `Show ${n} events`;
  }

  function set(next: Filters) {
    state = next;
    history.replaceState(null, "", `${location.pathname}?${writeFilters(new URLSearchParams(location.search), state)}`.replace(/\?$/, ""));
    paint();
    opts.onChange(state);
  }

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      const [key, value] = chip.dataset.set!.split("=") as [keyof Filters, string];
      const on = value === "1" ? state[key] === true : state[key] === value;
      // Tapping a chip that's on turns its filter off; one choice per group.
      set({ ...state, [key]: value === "1" ? !on : on ? "" : value });
    });
  }
  track.addEventListener("change", () => set({ ...state, track: track.value }));
  root.querySelector("[data-open-filters]")!.addEventListener("click", () => {
    refreshCount();
    sheet.showModal();
  });
  document.querySelector("[data-clear-filters]")!.addEventListener("click", () => set({ ...NO_FILTERS }));
  show.addEventListener("click", () => sheet.close());

  paint();
  return { get: () => state, set, refreshCount };
}
