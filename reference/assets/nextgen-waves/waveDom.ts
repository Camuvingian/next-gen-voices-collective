"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { DEFAULT_ACCENT, DEFAULT_SECONDARY, parseColor, type RGB } from "./waveMath";

/** Browser-side helpers shared by the WebGL and Canvas 2D renderers. */

export type WaveColors = { accent: RGB; secondary: RGB; version: number };
export type ColorOverrides = { accent?: string; secondary?: string };

function readVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

/**
 * Theme colours from --ng-glow / --ng-glow-2 on <html> ("r, g, b"), or from
 * props. Returned as a mutable ref that the render loop reads every frame, so
 * a theme switch applies on the next frame without restarting anything.
 */
export function useWaveColors(overrides: ColorOverrides | undefined, onChange?: () => void) {
  const ref = useRef<WaveColors>({ accent: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY, version: 0 });
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  const accent = overrides?.accent;
  const secondary = overrides?.secondary;
  useEffect(() => {
    const read = () => {
      const c = ref.current;
      c.accent = parseColor(accent) ?? parseColor(readVar("--ng-glow")) ?? DEFAULT_ACCENT;
      c.secondary = parseColor(secondary) ?? parseColor(readVar("--ng-glow-2")) ?? DEFAULT_SECONDARY;
      c.version++;
      cb.current?.();
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true });
    return () => mo.disconnect();
  }, [accent, secondary]);
  return ref;
}

/** On screen (IntersectionObserver) and the tab is visible. */
export function useInView(target: RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "64px" });
    io.observe(el);
    const vis = () => setTabVisible(!document.hidden);
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [target]);
  return onScreen && tabVisible;
}

/** three.js r150+ needs WebGL2. */
export function hasWebGL2() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/* ───────────── debug hook (tests only; off unless window.__NG_WAVES_DEBUG__ is set) ───────────── */

export type WaveDebugEntry = {
  id: string;
  mode: "webgl" | "2d";
  /** screen x (0…1 in the container) where the swell actually peaks, through the live camera */
  swellScreenX?: () => number;
  /** screen x of a pluck slot's centre */
  pluckScreenX?: (slot: number) => number;
  [key: string]: unknown;
};

type DebugWindow = { __NG_WAVES_DEBUG__?: boolean; __ngWaves?: Record<string, WaveDebugEntry> };

export function debugEnabled() {
  return typeof window !== "undefined" && !!(window as unknown as DebugWindow).__NG_WAVES_DEBUG__;
}

export function registerDebug(entry: WaveDebugEntry) {
  if (!debugEnabled()) return () => {};
  const w = window as unknown as DebugWindow;
  w.__ngWaves ??= {};
  w.__ngWaves[entry.id] = entry;
  return () => {
    if (w.__ngWaves?.[entry.id] === entry) delete w.__ngWaves[entry.id];
  };
}
