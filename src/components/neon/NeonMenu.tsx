"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CURTAIN_STYLES, LOGO_STYLES, NEON_COLOURS, NEON_DEFAULTS, NEON_FONTS, useNeon, type NeonSettings } from "./NeonProvider";

/**
 * Neon menu: a glass power button in the top-right corner that expands on
 * hover (or tap on touch screens) into the sign controls from the Neon Glass
 * studio: power, lettering, light colour, brightness, wall glow, glow blur,
 * glass reflections and tube thickness.
 */

type SliderKey = Exclude<keyof NeonSettings, "on" | "font" | "colour" | "piano" | "curtain" | "logo">;

const SLIDERS: { key: SliderKey; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "intensity", label: "Brightness", min: 0, max: 2, step: 0.05 },
  { key: "glow", label: "Wall glow", min: 0, max: 2, step: 0.05 },
  { key: "spread", label: "Glow blur", min: 0.3, max: 2.5, step: 0.05 },
  { key: "glass", label: "Glass reflections", min: 0, max: 1, step: 0.05 },
  { key: "thickness", label: "Tube thickness", min: 0.5, max: 2, step: 0.05, unit: "×" },
];

function NeonSlider({ k, label, min, max, step, unit }: { k: SliderKey; label: string; min: number; max: number; step: number; unit?: string }) {
  const neon = useNeon();
  const id = useId();
  return (
    <div className="ngn-ctl">
      <div className="ngn-ctl-head">
        <label id={id} className="ngn-menu-label">
          {label}
        </label>
        <output className="ngn-ctl-value" aria-hidden="true">
          {neon[k].toFixed(2)}
          {unit}
        </output>
      </div>
      <Slider
        className="ngn-slider"
        aria-labelledby={id}
        min={min}
        max={max}
        step={step}
        value={[neon[k]]}
        onValueChange={([v]) => neon.set(k, v)}
      />
    </div>
  );
}

export function NeonMenu() {
  const neon = useNeon();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const custom = neon.colour.startsWith("#") ? neon.colour : null;
  const changed = SLIDERS.some((s) => neon[s.key] !== NEON_DEFAULTS[s.key]) || neon.font !== NEON_DEFAULTS.font || neon.colour !== NEON_DEFAULTS.colour;

  // touch: tap outside or press Escape to close
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className={["ngn-menu", open && "is-open", neon.on ? "is-on" : "is-off"].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="ngn-menu-btn"
        aria-expanded={open}
        aria-controls="ngn-menu-panel"
        aria-label="Neon sign controls"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          {/* settings cog */}
          <path d="M10.3 2.8h3.4l.5 2.6 1.6.9 2.5-.9 1.7 2.9-2 1.8v1.8l2 1.8-1.7 2.9-2.5-.9-1.6.9-.5 2.6h-3.4l-.5-2.6-1.6-.9-2.5.9-1.7-2.9 2-1.8v-1.8l-2-1.8 1.7-2.9 2.5.9 1.6-.9z" />
          <circle cx="12" cy="12" r="3.1" />
        </svg>
      </button>

      <div id="ngn-menu-panel" className="ngn-menu-panel" role="group" aria-label="Site controls">
        <fieldset className="ngn-ctl">
          <legend className="ngn-menu-title">Logo</legend>
          <div className="ngn-seg ngn-seg--2" role="radiogroup" aria-label="Logo">
            {LOGO_STYLES.map((l) => (
              <button key={l.value} type="button" role="radio" aria-checked={neon.logo === l.value} className="ngn-seg-btn" onClick={() => neon.set("logo", l.value)}>
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="ngn-menu-row ngn-menu-row--piano">
          <label htmlFor="ngn-piano" className="ngn-menu-title">
            Piano Scroll
          </label>
          <span className="ngn-power">
            <span className="ngn-power-text" aria-hidden="true">
              {neon.piano ? "On" : "Off"}
            </span>
            <Switch id="ngn-piano" className="ngn-switch" checked={neon.piano} onCheckedChange={(v) => neon.set("piano", v)} />
          </span>
        </div>

        <fieldset className="ngn-ctl ngn-ctl--curtain">
          <legend className="ngn-menu-label">Page curtain</legend>
          <div className="ngn-seg ngn-seg--2" role="radiogroup" aria-label="Page curtain">
            {CURTAIN_STYLES.map((c) => (
              <button key={c.value} type="button" role="radio" aria-checked={neon.curtain === c.value} className="ngn-seg-btn" onClick={() => neon.set("curtain", c.value)}>
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="ngn-menu-row">
          <label htmlFor="ngn-power" className="ngn-menu-title">
            Neon signs
          </label>
          <span className="ngn-power">
            <span className="ngn-power-text" aria-hidden="true">
              {neon.on ? "On" : "Off"}
            </span>
            <Switch id="ngn-power" className="ngn-switch" checked={neon.on} onCheckedChange={(v) => neon.set("on", v)} />
          </span>
        </div>

        <fieldset className="ngn-ctl">
          <legend className="ngn-menu-label">Lettering</legend>
          <div className="ngn-seg" role="radiogroup" aria-label="Lettering">
            {NEON_FONTS.map((f) => (
              <button key={f.value} type="button" role="radio" aria-checked={neon.font === f.value} className="ngn-seg-btn" onClick={() => neon.set("font", f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ngn-ctl">
          <div className="ngn-ctl-head">
            <legend className="ngn-menu-label">Light colour</legend>
            <output className="ngn-ctl-value" aria-hidden="true">
              {(custom ?? NEON_COLOURS.find((c) => c.value === neon.colour)?.hex ?? "").toUpperCase()}
            </output>
          </div>
          <div className="ngn-swatches" role="radiogroup" aria-label="Light colour">
            {NEON_COLOURS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={neon.colour === c.value}
                aria-label={c.label}
                title={c.label}
                className="ngn-swatch"
                style={{ ["--sw" as string]: c.hex }}
                onClick={() => neon.set("colour", c.value)}
              />
            ))}
            <label className={["ngn-swatch ngn-swatch--custom", custom && "is-on"].filter(Boolean).join(" ")} title="Custom colour" style={custom ? { ["--sw" as string]: custom } : undefined}>
              <span className="ng-sr">Custom colour</span>
              <input type="color" value={custom ?? "#ff2e3f"} onChange={(e) => neon.set("colour", e.target.value)} />
              {!custom && (
                <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </label>
          </div>
        </fieldset>

        <div className="ngn-sliders">
          {SLIDERS.map((s) => (
            <NeonSlider key={s.key} k={s.key} label={s.label} min={s.min} max={s.max} step={s.step} unit={s.unit} />
          ))}
        </div>

        <div className="ngn-menu-foot">
          <p className="ngn-hint">Switch the signs off to see the glass.</p>
          <Button variant="ghost" size="sm" disabled={!changed} onClick={neon.reset}>
            <span className="ng-btn-label">Reset</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
