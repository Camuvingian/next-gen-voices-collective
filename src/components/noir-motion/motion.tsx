"use client";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

const Motion = createContext({ paused: false, reduced: false });
/** A single switch for the whole suite. OS reduced-motion always wins. */
export function NoirMotionProvider({
  children,
  paused = false,
  reducedMotion = false,
}: {
  children: ReactNode;
  paused?: boolean;
  reducedMotion?: boolean;
}) {
  const [system, setSystem] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystem(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <Motion.Provider value={{ paused, reduced: reducedMotion || system }}>
      <div
        className="nm-root"
        data-motion={
          reducedMotion || system ? "reduced" : paused ? "paused" : "full"
        }
      >
        {children}
      </div>
    </Motion.Provider>
  );
}

export function useMotion<T extends Element>(ref: RefObject<T | null>) {
  const policy = useContext(Motion);
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [system, setSystem] = useState(false);
  useEffect(() => {
    const change = () => setHidden(document.hidden);
    change();
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystem(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    document.addEventListener("visibilitychange", change);
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
        : null;
    if (ref.current) io?.observe(ref.current);
    return () => {
      io?.disconnect();
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", change);
    };
  }, [ref]);
  const reduced = policy.reduced || system;
  return {
    active: visible && !hidden && !policy.paused && !reduced,
    reduced,
    visible,
    paused: policy.paused,
    run: visible && !hidden && !policy.paused && !reduced ? "true" : "false",
  };
}

/** No React rendering per frame. Elapsed time freezes while hidden or paused. */
export function useFrame(
  active: boolean,
  reduced: boolean,
  draw: (seconds: number, dt: number) => void,
  still = 3.4,
) {
  const callback = useRef(draw);
  useLayoutEffect(() => {
    callback.current = draw;
  });
  const elapsed = useRef(0);
  useEffect(() => {
    let raf = 0,
      previous = 0;
    if (!active) {
      callback.current(reduced ? still : elapsed.current, 0);
      return;
    }
    const tick = (now: number) => {
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      elapsed.current += dt;
      callback.current(elapsed.current, dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, still]);
}
export const clamp = (x: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, x));
export const ease = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
