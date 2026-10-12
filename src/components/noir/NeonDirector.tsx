"use client";

import { useEffect } from "react";
import { useRouter } from "@/lib/router";
import { useNeon } from "@/components/neon/NeonProvider";
import { watchNeonSigns } from "@/components/neon/neonRegistry";

/**
 * NeonDirector: runs the neon signs (NeonSign).
 *  - each sign is armed (dark glass), then ignites with a stutter the first
 *    time it comes into view, after the page-load animation, and holds steady
 *  - afterwards, every 8–15 s a visible sign flickers (the hero sign most often)
 *  - switching the neon back on from the menu re-ignites everything in view
 * Styling lives in components/neon/neon.css; this only times it.
 */

const STATES = ["is-armed", "is-igniting", "is-flicker", "is-lit"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function NeonDirector() {
  const { route } = useRouter();
  const { on } = useNeon();

  useEffect(() => {
    if (!on || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
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

    const lit = new WeakSet<Element>();
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.add(e.target);
            if (!lit.has(e.target)) {
              lit.add(e.target);
              const hero = !!e.target.closest(".ng-hero-line");
              // the hero sign waits for the headline to finish rising
              timers.push(window.setTimeout(() => flash(e.target, "is-igniting", 2600), hero ? 900 : rand(150, 500)));
            }
          } else visible.delete(e.target);
        }
      },
      { threshold: 0.4 },
    );

    // only signs that have hydrated register here, so the classes below never
    // collide with React's hydration of server-rendered signs
    const armed = new Set<Element>();
    let stopWatching = () => {};
    const start = window.setTimeout(() => {
      stopWatching = watchNeonSigns((el, added) => {
        if (added) {
          el.classList.remove(...STATES);
          el.classList.add("is-armed");
          armed.add(el);
          io!.observe(el);
        } else {
          armed.delete(el);
          visible.delete(el);
          io!.unobserve(el);
        }
      });

      const tick = () => {
        const pool = Array.from(visible).filter((el) => !el.classList.contains("is-igniting"));
        if (pool.length) {
          const hero = pool.find((el) => el.closest(".ng-hero-line"));
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
      stopWatching();
      io?.disconnect();
      armed.forEach((el) => el.classList.remove(...STATES));
    };
  }, [route, on]);

  return null;
}
