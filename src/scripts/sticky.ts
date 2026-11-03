// Publishes the pinned page header's height as --sticky-offset, so sticky hour
// headers sit just below it instead of underneath.
const head = document.querySelector<HTMLElement>("[data-sticky-head]");
if (head) {
  const set = () =>
    document.documentElement.style.setProperty("--sticky-offset", `${head.offsetHeight}px`);
  new ResizeObserver(set).observe(head);
  set();
}
