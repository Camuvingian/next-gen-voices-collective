"use client";

import { useEffect, useRef, useState } from "react";

/** Shows once the visitor is about a screen down the page. */
const SHOW_AFTER = 0.8;
const IGNITE_MS = 2600;
const FLICKER_MS = 1300;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** One neon tube: a ring whose base runs up into the arrow (shaft joins the ring at the bottom). */
const TUBE = "M24 43 A19 19 0 1 1 24.01 43 M24 43 V11.5 M15 20.5 L24 11.5 L33 20.5";

/**
 * Back-to-top: a neon ring-and-arrow sign, bottom right, in the neon colour.
 * Ignites with a stutter the first time it appears, then flickers every
 * 8–15 s like the headline signs (same keyframes, see noir.css).
 */
export function ScrollTop() {
  const [shown, setShown] = useState(false);
  const [state, setState] = useState<"off" | "igniting" | "lit" | "flicker">("off");
  const lit = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const on = () => {
      const next = window.scrollY > window.innerHeight * SHOW_AFTER;
      setShown(next);
      // the first time it appears, the sign ignites (or simply lights with reduced motion)
      if (next && !lit.current) {
        lit.current = true;
        setState(reduce ? "lit" : "igniting");
        if (!reduce) window.setTimeout(() => setState("lit"), IGNITE_MS);
      }
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // while it's on screen, a flicker every 8–15 s
  useEffect(() => {
    if (!shown || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const schedule = (first: boolean) => {
      timer = window.setTimeout(() => {
        setState("flicker");
        timer = window.setTimeout(() => {
          setState("lit");
          schedule(false);
        }, FLICKER_MS);
      }, (first ? IGNITE_MS : 0) + rand(8000, 15000));
    };
    schedule(true);
    return () => clearTimeout(timer);
  }, [shown]);

  const toTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className={["ng-totop", shown && "is-shown", state !== "off" && `is-${state}`].filter(Boolean).join(" ")}
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
    >
      <svg viewBox="-3 -3 54 54" aria-hidden="true">
        <path className="ng-totop-glass" d={TUBE} />
        <path className="ng-totop-core" d={TUBE} />
      </svg>
    </button>
  );
}
