"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyNeonSettings } from "./neonBoot";
import type { NeonFont } from "./NeonSign";

/**
 * Site-wide neon settings (the controls in the neon menu): power, lettering,
 * colour and the glass/light material. Remembered per visitor (localStorage
 * "ng-neon"). Power and colour are applied to <html> by applyNeonSettings,
 * which also runs as an inline <head> script so a reload paints the saved
 * look straight away (NeonBootScript).
 */

export const NEON_FONTS: { value: NeonFont; label: string }[] = [
  { value: "script", label: "Script" },
  { value: "tube", label: "Tube" },
  { value: "deco", label: "Deco" },
];

/** The neon colour options from tokens.css ("red" = no attribute). */
export const NEON_COLOURS = [
  { value: "red", label: "Neon red", hex: "#ff2e3f" },
  { value: "ruby", label: "Ruby", hex: "#d1112b" },
  { value: "white", label: "White neon", hex: "#f4f1ea" },
  { value: "blue", label: "Blue note", hex: "#4fc3ff" },
  { value: "pink", label: "Neon pink", hex: "#ff5fa2" },
  { value: "violet", label: "Violet", hex: "#b26bff" },
] as const;

export type NeonSettings = {
  on: boolean;
  font: NeonFont;
  /** a NEON_COLOURS value, or a custom "#rrggbb" */
  colour: string;
  /** tube light / brightness, 0–2 */
  intensity: number;
  /** wall glow strength, 0–2 */
  glow: number;
  /** glow blur radius (spread), multiplier 0.3–2.5 */
  spread: number;
  /** glass reflections, 0–1 */
  glass: number;
  /** tube thickness, multiplier of the lettering's own width 0.5–2 */
  thickness: number;
  /** Piano Scroll: the piano rail down the left edge that tracks scroll progress */
  piano: boolean;
};

export const NEON_DEFAULTS: NeonSettings = {
  on: true,
  font: "script",
  colour: "red",
  intensity: 1,
  glow: 1,
  spread: 1,
  glass: 0.85,
  thickness: 1,
  piano: false,
};

const KEY = "ng-neon";

type NeonCtx = NeonSettings & {
  set: <K extends keyof NeonSettings>(key: K, value: NeonSettings[K]) => void;
  reset: () => void;
};

const Ctx = createContext<NeonCtx>({ ...NEON_DEFAULTS, set: () => {}, reset: () => {} });

/* ── storage ──────────────────────────────────────────── */
function load(): Partial<NeonSettings> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<NeonSettings>) : null;
  } catch {
    return null; // storage blocked or corrupt: defaults
  }
}
function save(s: NeonSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: settings last this visit */
  }
}

function sanitize(saved: Partial<NeonSettings>): NeonSettings {
  const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const d = NEON_DEFAULTS;
  return {
    on: typeof saved.on === "boolean" ? saved.on : d.on,
    font: NEON_FONTS.some((f) => f.value === saved.font) ? (saved.font as NeonFont) : d.font,
    colour: typeof saved.colour === "string" && (/^#[0-9a-f]{6}$/i.test(saved.colour) || NEON_COLOURS.some((c) => c.value === saved.colour)) ? saved.colour : d.colour,
    intensity: num(saved.intensity, 0, 2, d.intensity),
    glow: num(saved.glow, 0, 2, d.glow),
    spread: num(saved.spread, 0.3, 2.5, d.spread),
    glass: num(saved.glass, 0, 1, d.glass),
    thickness: num(saved.thickness, 0.5, 2, d.thickness),
    piano: typeof saved.piano === "boolean" ? saved.piano : d.piano,
  };
}

export function NeonProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NeonSettings>(NEON_DEFAULTS);
  const [restored, setRestored] = useState(false);

  // restore the visitor's settings after hydration (the server render uses the defaults;
  // the <head> boot script has already painted the saved colour and power)
  useEffect(() => {
    const saved = load();
    queueMicrotask(() => {
      if (saved) setSettings(sanitize(saved));
      setRestored(true);
    });
  }, []);

  // signs are drawn in the saved lettering now: let them show
  useEffect(() => {
    if (restored) delete document.documentElement.dataset.neonPending;
  }, [restored]);

  useEffect(() => {
    if (restored) applyNeonSettings({ on: settings.on, colour: settings.colour }, false);
  }, [restored, settings.on, settings.colour]);

  const set = useCallback(<K extends keyof NeonSettings>(key: K, value: NeonSettings[K]) => {
    setSettings((s) => {
      const next = { ...s, [key]: value };
      save(next);
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    setSettings((s) => {
      const next = { ...NEON_DEFAULTS, on: s.on, piano: s.piano };
      save(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...settings, set, reset }), [settings, set, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useNeon = () => useContext(Ctx);
