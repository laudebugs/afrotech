// While you type on a phone, the tab bar slides out of the way, as in an
// iPhone app: <html data-typing> is set while a text field or the note
// editor has focus and you're typing in it: you tapped into it, or the
// on-screen keyboard is up. A field focused by the page itself (search's
// autofocus, which opens no keyboard on iPhone) leaves the bar alone.
// AppNav.astro does the hiding, on touch screens only.
const TEXT_INPUTS = new Set(["text", "search", "email", "url", "tel", "number", "password", "date", "time"]);

function isTextField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && TEXT_INPUTS.has(el.type);
}

const vv = window.visualViewport;
const keyboardUp = () => (vv ? (vv.scale ?? 1) < 1.05 && window.innerHeight - vv.height > 120 : false);

let lastTouch = 0;
document.addEventListener("pointerdown", () => (lastTouch = Date.now()), true);
document.addEventListener("keydown", () => (lastTouch = Date.now()), true);

let typing = false;
function syncTyping(e?: Event) {
  const field = isTextField(document.activeElement);
  if (!field) typing = false;
  // Focus that follows a tap or a key (not one the page set on load) counts.
  else if (e?.type === "focusin" && Date.now() - lastTouch < 1000) typing = true;
  const on = field && (typing || keyboardUp());
  document.documentElement.toggleAttribute("data-typing", on);
}

document.addEventListener("focusin", syncTyping);
// Focus may be moving to another field, so check once it lands.
document.addEventListener("focusout", () => setTimeout(syncTyping));
vv?.addEventListener("resize", () => syncTyping());
window.addEventListener("pageshow", () => syncTyping());
export {};
