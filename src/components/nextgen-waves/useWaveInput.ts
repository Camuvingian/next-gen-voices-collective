"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { MAX_PLUCKS, PLUCK_LIFE, cameraZFor, computeSpan, screenToLine } from "./waveMath";

/**
 * Pointer / touch / pluck / energy logic for the NextGen waves.
 *
 * Two layers:
 *  - createWaveInput(): a plain object with no DOM or renderer. It is fed
 *    normalised coordinates and a frame delta, and returns a WaveFrame of
 *    uniform values. Deterministic, so it is unit-tested directly.
 *  - useWaveInput(): the React hook that attaches passive window listeners,
 *    hit-tests them against the container rect and feeds the core.
 */

export type WaveInputOptions = {
  /** gesture extras: two-finger pinch widens the swell, finger height bends the ribbon */
  pinch?: boolean;
  /** after 6 s without input the swell drifts across the field (touch devices) */
  idleBreath?: boolean;
  /** every ~20 s ease the alto to a minor third and back */
  chordChanges?: boolean;
};

export type WaveFrame = {
  time: number;
  mouseT: number; // swell centre, line space (spec mapping, depth 0)
  swellW: number;
  strength: number;
  parX: number; // eased pointer 0…1 (parallax)
  parY: number;
  pl: Float32Array; // 3 × (x line space, age s, amp) → uniform vec3 uPl[3]
  ampMul: number; // scroll breath
  chordMix: number; // 0 major … 1 minor
  bend: number; // −1…1
  energy: number;
  idle: boolean;
};

export type WaveInput = ReturnType<typeof createWaveInput>;

const ENERGY_CAP = 1.6;
const IDLE_AFTER = 6;
const CHORD_EVERY = 20;
const CHORD_EASE = 2;
const CHORD_HOLD = 5;

/** Per-frame easing factors are specified at 60 fps; this keeps them frame-rate independent. */
const ease = (k: number, dt: number) => 1 - Math.pow(1 - k, dt * 60);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => x * x * (3 - 2 * x);

export function createWaveInput(options: WaveInputOptions = {}) {
  const opts = { ...options };
  const state = {
    span: 1,
    cameraZ: 4.2,
    aspect: 1,
    width: 1,
    height: 1,
    time: 0,
    frozenTime: null as number | null,
    // swell
    targetX: 0.5, // screen x target (0…1)
    mouseT: 0.5, // eased, line space
    energy: 0,
    lastX: NaN,
    lastMs: NaN,
    // parallax
    tx: 0.5,
    ty: 0.5,
    px: 0.5,
    py: 0.5,
    // plucks (ring buffer)
    head: 0,
    plX: new Float32Array(MAX_PLUCKS),
    plBorn: new Float32Array(MAX_PLUCKS),
    plAmp: new Float32Array(MAX_PLUCKS),
    // extras
    scrollV: 0,
    scrollBreath: 0,
    lastScrollY: NaN,
    lastScrollMs: NaN,
    pinchScale: 1,
    pinchTarget: 1,
    bend: 0,
    bendTarget: 0,
    lastInput: 0,
    idlePhase: NaN,
    touchDevice: false,
  };
  const frame: WaveFrame = {
    time: 0,
    mouseT: 0.5,
    swellW: 0.42,
    strength: 0.9,
    parX: 0.5,
    parY: 0.5,
    pl: new Float32Array(MAX_PLUCKS * 3),
    ampMul: 1,
    chordMix: 0,
    bend: 0,
    energy: 0,
    idle: false,
  };

  function markInput() {
    state.lastInput = state.time;
    state.idlePhase = NaN;
  }

  /** tests/debug: force values regardless of input (null = live) */
  const overrides = { strength: null as number | null, swellW: null as number | null };

  return {
    state,
    frame,
    options: opts,
    overrides,

    setOptions(o: WaveInputOptions) {
      Object.assign(opts, o);
    },

    /** Container size in CSS px. Picks the camera distance and recomputes the span. */
    setViewport(width: number, height: number) {
      state.width = Math.max(1, width);
      state.height = Math.max(1, height);
      state.aspect = state.width / state.height;
      state.cameraZ = cameraZFor(state.width);
      state.span = computeSpan(state.cameraZ, state.aspect);
    },

    screenToLine(x: number) {
      return screenToLine(x, state.span);
    },

    setTouchDevice(v: boolean) {
      state.touchDevice = v;
    },

    /** Pointer/finger at (x, y) in container-normalised coords; tMs = event timestamp. */
    move(x: number, y: number, tMs: number) {
      const dt = tMs - state.lastMs;
      if (Number.isFinite(state.lastX) && dt > 0 && dt < 250) {
        state.energy = Math.min(ENERGY_CAP, state.energy + Math.min(0.5, (Math.abs(x - state.lastX) / dt) * 60));
      }
      state.lastX = x;
      state.lastMs = tMs;
      state.targetX = clamp01(x);
      state.tx = clamp01(x);
      state.ty = clamp01(y);
      markInput();
    },

    /** Pointer left / finger lifted: the swell stays put and its energy decays naturally. */
    release() {
      state.lastX = NaN;
      state.lastMs = NaN;
      state.pinchTarget = 1;
      state.bendTarget = 0;
    },

    /** Start a ripple at screen x (0…1). Returns the line-space x it was placed at. */
    pluck(x: number, amp = 1) {
      const i = state.head;
      state.head = (state.head + 1) % MAX_PLUCKS;
      const t = screenToLine(clamp01(x), state.span);
      state.plX[i] = t;
      state.plBorn[i] = state.time;
      state.plAmp[i] = amp;
      state.energy = Math.min(ENERGY_CAP, state.energy + 0.6);
      markInput();
      return t;
    },

    /** Two-finger distance relative to where the pinch began. */
    pinch(scale: number) {
      state.pinchTarget = Math.min(2.5, Math.max(0.6, scale));
      markInput();
    },

    /** Finger height in the container (0 top … 1 bottom) → bend −1…1. */
    bendAt(y: number) {
      state.bendTarget = Math.max(-1, Math.min(1, (0.5 - y) * 2));
    },

    scroll(scrollY: number, tMs: number) {
      const dt = tMs - state.lastScrollMs;
      if (Number.isFinite(state.lastScrollY) && dt > 0) {
        const v = Math.abs(scrollY - state.lastScrollY) / dt; // px/ms
        state.scrollV = Math.max(state.scrollV, Math.min(1, v / 3));
      }
      state.lastScrollY = scrollY;
      state.lastScrollMs = tMs;
    },

    /** Debug/tests and reduced motion: pin the clock (null to release). */
    freezeTime(t: number | null) {
      state.frozenTime = t;
    },

    /** Advance by dt seconds (clamped, so a paused tab never jumps) and return the frame. */
    tick(dtIn: number): WaveFrame {
      const dt = Math.min(Math.max(dtIn, 0), 0.05);
      state.time += dt;
      const time = state.frozenTime ?? state.time;

      // idle breath: after 6 s of no input on a touch device, drift the swell slowly
      let idle = false;
      if (opts.idleBreath && state.touchDevice && state.time - state.lastInput > IDLE_AFTER) {
        idle = true;
        if (Number.isNaN(state.idlePhase)) {
          // start the drift from wherever the swell is now
          state.idlePhase = Math.asin(Math.max(-1, Math.min(1, (state.targetX - 0.5) / 0.38)));
        }
        state.idlePhase += dt * 0.35;
        state.targetX = 0.5 + 0.38 * Math.sin(state.idlePhase);
        state.tx = state.targetX;
      }

      // swell follows quickly, parallax lazily
      const targetT = screenToLine(state.targetX, state.span);
      state.mouseT += (targetT - state.mouseT) * ease(0.25, dt);
      state.px += (state.tx - state.px) * ease(0.08, dt);
      state.py += (state.ty - state.py) * ease(0.06, dt);
      state.energy *= Math.pow(0.95, dt * 60);

      state.pinchScale += (state.pinchTarget - state.pinchScale) * ease(0.12, dt);
      state.bend += ((opts.pinch ? state.bendTarget : 0) - state.bend) * ease(0.08, dt);

      // scroll breath: a gentle, eased lift of the amplitude
      state.scrollBreath += (state.scrollV - state.scrollBreath) * ease(0.1, dt);
      state.scrollV *= Math.pow(0.9, dt * 60);

      // plucks: age and retire
      for (let i = 0; i < MAX_PLUCKS; i++) {
        const age = state.time - state.plBorn[i];
        if (state.plAmp[i] > 0 && age > PLUCK_LIFE) state.plAmp[i] = 0;
        frame.pl[i * 3] = state.plX[i];
        frame.pl[i * 3 + 1] = state.plAmp[i] > 0 ? age : 0;
        frame.pl[i * 3 + 2] = state.plAmp[i];
      }

      // chord change: every 20 s ease to minor (2 s), hold, ease back (2 s)
      let chordMix = 0;
      if (opts.chordChanges) {
        const c = time % CHORD_EVERY;
        const start = CHORD_EVERY - (CHORD_EASE * 2 + CHORD_HOLD);
        if (c > start) {
          const k = c - start;
          chordMix =
            k < CHORD_EASE ? smooth(k / CHORD_EASE) : k < CHORD_EASE + CHORD_HOLD ? 1 : smooth(1 - (k - CHORD_EASE - CHORD_HOLD) / CHORD_EASE);
        }
      }

      const e = state.energy;
      frame.time = time;
      frame.mouseT = state.mouseT;
      frame.swellW = overrides.swellW !== null ? overrides.swellW * state.span : 0.42 * state.span * (1 - 0.25 * Math.min(1, e)) * (opts.pinch ? state.pinchScale : 1);
      frame.strength = overrides.strength ?? 0.9 + 1.2 * e;
      frame.parX = state.px;
      frame.parY = state.py;
      frame.ampMul = 1 + 0.16 * state.scrollBreath;
      frame.chordMix = chordMix;
      frame.bend = state.bend;
      frame.energy = e;
      frame.idle = idle;
      return frame;
    },
  };
}

/* ───────────── React layer ───────────── */

export type UseWaveInputOptions = WaveInputOptions & {
  interactive?: boolean;
  plucks?: boolean;
  scrollCoupling?: boolean;
  /** true = attach nothing (prefers-reduced-motion) */
  disabled?: boolean;
  onPluck?: (xNorm: number) => void;
};

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia?.(REDUCED);
  mq?.addEventListener("change", cb);
  return () => mq?.removeEventListener("change", cb);
};

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia?.(REDUCED).matches ?? false,
    () => false,
  );
}

/**
 * Listens on window (the canvas has pointer-events: none, so content above the
 * waves stays clickable) and hit-tests against the container rect. All
 * listeners are passive and nothing calls preventDefault: scrolling and clicks
 * are never blocked.
 */
export function useWaveInput(target: RefObject<HTMLElement | null>, o: UseWaveInputOptions = {}): WaveInput {
  const [input] = useState(() => createWaveInput(o));
  const onPluck = useRef(o.onPluck);
  useEffect(() => {
    onPluck.current = o.onPluck;
  });
  useEffect(() => {
    input.setOptions({ pinch: o.pinch, idleBreath: o.idleBreath, chordChanges: o.chordChanges });
  }, [input, o.pinch, o.idleBreath, o.chordChanges]);

  const { interactive = true, plucks = true, scrollCoupling = true, disabled = false, pinch = false } = o;

  useEffect(() => {
    const el = target.current;
    if (!el || disabled) return;
    const ac = new AbortController();
    const opt: AddEventListenerOptions = { passive: true, signal: ac.signal };
    input.setTouchDevice(window.matchMedia?.("(hover: none)").matches ?? false);

    /** container-normalised coords, or null when outside the rect vertically */
    const local = (cx: number, cy: number, needX = false) => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || cy < r.top || cy > r.bottom) return null;
      if (needX && (cx < r.left || cx > r.right)) return null;
      return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height };
    };

    if (interactive) {
      window.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType === "touch") return; // touch is handled by touch events (pointercancel fires on scroll)
          const p = local(e.clientX, e.clientY);
          if (p) input.move(p.x, p.y, e.timeStamp);
        },
        opt,
      );
      document.documentElement.addEventListener("pointerleave", () => input.release(), opt);

      let pinchStart = 0;
      const onTouch = (e: TouchEvent) => {
        const a = e.touches[0];
        if (!a) return;
        let cx = a.clientX, cy = a.clientY;
        if (pinch && e.touches.length >= 2) {
          const b = e.touches[1];
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          if (e.type === "touchstart" || !pinchStart) pinchStart = d;
          else input.pinch(d / pinchStart);
          cx = (a.clientX + b.clientX) / 2;
          cy = (a.clientY + b.clientY) / 2;
        }
        const p = local(cx, cy);
        if (!p) return;
        input.move(p.x, p.y, e.timeStamp);
        if (pinch) input.bendAt(p.y);
      };
      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) pinchStart = 0;
        if (e.touches.length === 0) input.release();
      };
      window.addEventListener("touchstart", onTouch, opt);
      window.addEventListener("touchmove", onTouch, opt);
      window.addEventListener("touchend", onTouchEnd, opt);
      window.addEventListener("touchcancel", onTouchEnd, opt);

      if (plucks) {
        window.addEventListener(
          "pointerdown",
          (e) => {
            const p = local(e.clientX, e.clientY, true);
            if (!p) return;
            if (e.pointerType === "touch") input.move(p.x, p.y, e.timeStamp);
            input.pluck(p.x, e.pointerType === "touch" ? 1.1 : 1);
            onPluck.current?.(p.x);
          },
          opt,
        );
      }
    }

    if (scrollCoupling) {
      window.addEventListener("scroll", () => input.scroll(window.scrollY, performance.now()), opt);
    }

    return () => ac.abort();
  }, [input, target, interactive, plucks, scrollCoupling, disabled, pinch]);

  return input;
}
