// Directions open a maps app on phones (plan 0008, todo 032). Links marked
// data-directions="<address>" are built as Google Maps web links, which a
// computer opens in a new tab. On Android, a tap opens a geo: link, so the
// system offers every maps app. On iPhone and iPad, a sheet asks which app
// to use, with the last choice first.
import { MAPS_APPS, geoLink, type MapsApp } from "../lib/directions";
import { getItem, setItem } from "../lib/storage";

const LAST_APP = "afrotech:maps-app";

const isApple = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac with touch.
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const isAndroid = () => /Android/.test(navigator.userAgent);

let sheet: HTMLDialogElement | null = null;

function chooser(address: string) {
  sheet?.remove();
  const dialog = document.createElement("dialog");
  sheet = dialog;
  dialog.className = "maps-chooser";
  dialog.setAttribute("aria-labelledby", "maps-chooser-title");

  const title = document.createElement("h2");
  title.id = "maps-chooser-title";
  title.textContent = "Open directions in";
  const where = document.createElement("p");
  where.className = "muted";
  where.textContent = address;

  const last = getItem(LAST_APP) as MapsApp | null;
  const apps = [...MAPS_APPS].sort((a, b) => Number(b.id === last) - Number(a.id === last));
  const list = document.createElement("div");
  list.className = "maps-apps";
  for (const app of apps) {
    const a = document.createElement("a");
    a.className = "button";
    a.href = app.link(address);
    a.rel = "noopener";
    a.textContent = app.label;
    a.addEventListener("click", () => {
      setItem(LAST_APP, app.id);
      dialog.close();
    });
    list.append(a);
  }
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "button cancel";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => dialog.close());

  dialog.append(title, where, list, cancel);
  // Tapping outside the sheet closes it.
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  (list.firstElementChild as HTMLElement | null)?.focus();
}

document.addEventListener("click", (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>("a[data-directions]");
  if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const address = link.dataset.directions!;
  if (isAndroid()) {
    e.preventDefault();
    location.href = geoLink(address);
  } else if (isApple()) {
    e.preventDefault();
    chooser(address);
  }
  // A computer follows the Google Maps link into a new tab.
});
