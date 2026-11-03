// Publishes the pinned page header's height as --sticky-offset, so sticky hour
// headers sit just below it instead of underneath.
const head = document.querySelector<HTMLElement>(".sticky-head");
if (head) {
  const publishHeight = () =>
    document.documentElement.style.setProperty("--sticky-offset", `${head.offsetHeight}px`);
  new ResizeObserver(publishHeight).observe(head);
  publishHeight();
}
