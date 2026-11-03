// Registers the service worker (production builds only; `astro dev` has none),
// tells it which events are starred, and shows "Updated, tap to reload" when a
// new version is waiting.
import { readPlan } from "../lib/plan";

function saveStarred() {
  navigator.serviceWorker.controller?.postMessage({ type: "save-events", ids: readPlan() });
}

function offerUpdate(worker: ServiceWorker) {
  const note = document.querySelector<HTMLElement>("[data-update]");
  if (!note) return;
  note.hidden = false;
  note.querySelector("button")?.addEventListener(
    "click",
    () => {
      reloadWhenReady = true;
      worker.postMessage({ type: "skip-waiting" });
    },
    { once: true },
  );
}

let reloadWhenReady = false;

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      // An update that finished downloading on an earlier visit.
      if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const incoming = registration.installing;
        incoming?.addEventListener("statechange", () => {
          // "installed" with a page already controlled means an update is waiting.
          if (incoming.state === "installed" && navigator.serviceWorker.controller) offerUpdate(incoming);
        });
      });
      await navigator.serviceWorker.ready;
      saveStarred();
    } catch {
      // No service worker: the site works as before, online only.
    }
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadWhenReady) location.reload();
    else saveStarred(); // the first install just took over
  });
  document.addEventListener("plan-change", saveStarred);
}
