// Shows "Offline. Showing saved pages from …" while the device has no connection.
const banner = document.querySelector<HTMLElement>("[data-offline]");

function update() {
  if (banner) banner.hidden = navigator.onLine;
}

window.addEventListener("online", update);
window.addEventListener("offline", update);
update();
