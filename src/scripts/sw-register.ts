// Registers the service worker (production builds only; `astro dev` has none)
// and tells it which events are starred, so their pages open offline.
import { readPlan } from "../lib/plan";

function saveStarred() {
  navigator.serviceWorker.controller?.postMessage({ type: "save-events", ids: readPlan() });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(saveStarred)
      .catch(() => {
        // No service worker: the site works as before, online only.
      });
  });
  // A new worker takes over after a deploy; give it the plan too.
  navigator.serviceWorker.addEventListener("controllerchange", saveStarred);
  document.addEventListener("plan-change", saveStarred);
}
