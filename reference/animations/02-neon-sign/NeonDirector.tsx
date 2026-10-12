import { useEffect } from "react";
import { useRouter } from "../lib/router";

/**
 * NeonDirector: runs the neon signs.
 *  - every emphasised word (`em` in headlines, the hero "One sound.") is a neon tube
 *  - each sign ignites with a stutter the first time it comes into view,
 *    after the page-load animation, then settles to a steady glow
 *  - afterwards, every 8–15 s a visible sign flickers (the hero sign most often)
 * Styling lives in noir.css (.is-igniting / .is-flicker); this only times it.
 */

const NEON = ".ng-hero-line.ng-italic, .ng-display em, .ng-h1 em, .ng-h2 em";
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function NeonDirector() {
  const { route } = useRouter();

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    const visible = new Set<Element>();
    let io: IntersectionObserver | null = null;

    const flash = (el: Element, cls: "is-igniting" | "is-flicker", ms: number) => {
      el.classList.remove("is-igniting", "is-flicker");
      void (el as HTMLElement).offsetWidth; // restart the animation
      el.classList.add(cls);
      timers.push(
        window.setTimeout(() => {
          el.classList.remove(cls);
          el.classList.add("is-lit");
        }, ms),
      );
    };

    const start = window.setTimeout(() => {
      const signs = Array.from(document.querySelectorAll(NEON));
      const lit = new WeakSet<Element>();
      signs.forEach((el) => el.classList.add("ng-neon"));
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              visible.add(e.target);
              if (!lit.has(e.target)) {
                lit.add(e.target);
                const hero = e.target.matches(".ng-hero-line");
                // the hero sign waits for the headline to finish rising
                timers.push(window.setTimeout(() => flash(e.target, "is-igniting", 2600), hero ? 900 : rand(150, 500)));
              }
            } else visible.delete(e.target);
          }
        },
        { threshold: 0.4 },
      );
      signs.forEach((el) => io!.observe(el));

      const tick = () => {
        const pool = Array.from(visible).filter((el) => !el.classList.contains("is-igniting"));
        if (pool.length) {
          const hero = pool.find((el) => el.matches(".ng-hero-line"));
          const el = hero && Math.random() < 0.65 ? hero : pool[Math.floor(Math.random() * pool.length)];
          flash(el, "is-flicker", 1300);
        }
        timers.push(window.setTimeout(tick, rand(8000, 15000)));
      };
      timers.push(window.setTimeout(tick, rand(8000, 15000)));
    }, 60);

    return () => {
      clearTimeout(start);
      timers.forEach(clearTimeout);
      io?.disconnect();
      document.querySelectorAll(".ng-neon").forEach((el) => el.classList.remove("is-igniting", "is-flicker", "ng-neon", "is-lit"));
    };
  }, [route]);

  return null;
}
