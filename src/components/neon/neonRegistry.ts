/**
 * Live neon signs, registered by each NeonSign once it has hydrated.
 *
 * NeonDirector toggles state classes (is-armed, is-lit…) on the sign elements
 * directly. It must only touch signs React has already hydrated: with
 * streaming, a sign can still be server HTML when the director starts, and a
 * class added then shows up as a hydration mismatch. A component's effects run
 * only after it hydrates, so registering from an effect marks the safe moment.
 */

type Listener = (el: Element, added: boolean) => void;

const signs = new Set<Element>();
const listeners = new Set<Listener>();

export function registerNeonSign(el: Element) {
  signs.add(el);
  listeners.forEach((l) => l(el, true));
  return () => {
    signs.delete(el);
    listeners.forEach((l) => l(el, false));
  };
}

/** Calls back for every sign already live, then for each one added or removed. */
export function watchNeonSigns(listener: Listener) {
  listeners.add(listener);
  signs.forEach((el) => listener(el, true));
  return () => void listeners.delete(listener);
}
