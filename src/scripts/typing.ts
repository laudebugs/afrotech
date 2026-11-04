// While you type on a phone, the tab bar slides out of the way, as in an
// iPhone app: <html data-typing> is set while a text field or the note
// editor has focus and you're typing in it: you tapped into it, or the
// on-screen keyboard is up. A field focused by the page itself (search's
// autofocus, which opens no keyboard on iPhone) leaves the bar alone.
// AppNav.astro does the hiding, on touch screens only.
// Fields that open the on-screen keyboard (date and time open pickers instead).
const TEXT_INPUTS = new Set(["text", "search", "email", "url", "tel", "number", "password"]);

function isTextField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  // Controls that belong to typing, such as the note editor's toolbar and
  // its menus, keep the bar away too.
  if (el.closest("[data-keeps-typing]")) return true;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  return el instanceof HTMLInputElement && TEXT_INPUTS.has(el.type) && !el.readOnly;
}

const vv = window.visualViewport;
/** Whether the on-screen keyboard covers part of the page (a pinch-zoom
 *  also shrinks the visible area, so it doesn't count). Shared with the
 *  note editor's toolbar. */
export const keyboardUp = () => (vv ? (vv.scale ?? 1) < 1.05 && window.innerHeight - vv.height > 120 : false);

let lastTouch = 0;
document.addEventListener("pointerdown", () => (lastTouch = Date.now()), true);
document.addEventListener("keydown", () => (lastTouch = Date.now()), true);

// A tap into a field counts as typing until the keyboard has come up; after
// that, the keyboard decides, so dismissing it (Android's Back) brings the bar
// back even though the field keeps focus.
let typing = false;
let keyboardSeen = false;
function syncTyping(e?: Event) {
  const field = isTextField(document.activeElement);
  const kb = keyboardUp();
  if (!field) typing = keyboardSeen = false;
  // Focus that follows a tap or a key (not one the page set on load) counts.
  else if (e?.type === "focusin" && Date.now() - lastTouch < 1000) typing = true;
  if (kb) keyboardSeen = true;
  else if (keyboardSeen) typing = keyboardSeen = false;
  const on = field && (typing || kb);
  document.documentElement.toggleAttribute("data-typing", on);
}

document.addEventListener("focusin", syncTyping);
// Focus may be moving to another field, so check once it lands.
document.addEventListener("focusout", () => setTimeout(syncTyping));
vv?.addEventListener("resize", () => syncTyping());
// Back to a page kept in memory: start fresh, keyboard down.
window.addEventListener("pageshow", () => {
  typing = keyboardSeen = false;
  syncTyping();
});
