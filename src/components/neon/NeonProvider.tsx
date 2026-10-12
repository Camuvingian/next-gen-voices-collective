"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { NeonFont } from "./NeonSign";

/**
 * Site-wide neon settings: whether the signs are switched on, and the default
 * lettering. Remembered per visitor (localStorage) and mirrored onto <html>
 * as data-neon="on|off" so CSS can power every sign down at once.
 */

export const NEON_FONTS: { value: NeonFont; label: string }[] = [
  { value: "script", label: "Script" },
  { value: "tube", label: "Tube" },
  { value: "deco", label: "Deco" },
];

const DEFAULT_FONT: NeonFont = "script";
const KEY_ON = "ng-neon-on";
const KEY_FONT = "ng-neon-font";

type NeonCtx = {
  on: boolean;
  font: NeonFont;
  setOn: (on: boolean) => void;
  setFont: (font: NeonFont) => void;
};

const Ctx = createContext<NeonCtx>({ on: true, font: DEFAULT_FONT, setOn: () => {}, setFont: () => {} });

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked: defaults
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice lasts this visit */
  }
};

export function NeonProvider({ children }: { children: ReactNode }) {
  const [on, setOnState] = useState(true);
  const [font, setFontState] = useState<NeonFont>(DEFAULT_FONT);

  // restore the visitor's choices after hydration
  useEffect(() => {
    const savedOn = read(KEY_ON);
    const savedFont = read(KEY_FONT);
    const fontOk = NEON_FONTS.some((f) => f.value === savedFont);
    if (savedOn === "off" || fontOk) {
      // a single deferred update keeps the first paint identical to the server render
      queueMicrotask(() => {
        if (savedOn === "off") setOnState(false);
        if (fontOk) setFontState(savedFont as NeonFont);
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.neon = on ? "on" : "off";
  }, [on]);

  const setOn = useCallback((v: boolean) => {
    setOnState(v);
    write(KEY_ON, v ? "on" : "off");
  }, []);
  const setFont = useCallback((f: NeonFont) => {
    setFontState(f);
    write(KEY_FONT, f);
  }, []);

  return <Ctx.Provider value={{ on, font, setOn, setFont }}>{children}</Ctx.Provider>;
}

export const useNeon = () => useContext(Ctx);
