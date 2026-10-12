"use client";

import { Fragment, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TUBE_FALLBACK, TUBE_GLYPHS } from "./glyphs";
import { useNeon } from "./NeonProvider";

/**
 * NeonSign: photorealistic neon lettering (lifted from media/neon-glass-preview.html).
 *
 * Each word is its own SVG sign so headlines still wrap naturally; the words sit
 * on the text baseline and scale with the surrounding font size. Only the
 * lettering is drawn: no backing board or wall. The material is layered strokes:
 *   glass under  → drop shadow, glass tint, coloured glass (unlit), dark interior
 *   light        → wall spill, halo, aura, coloured core, white-hot core
 *   glass over   → specular reflection, highlight streak
 * Only the light layers ignite and flicker (see neon.css + NeonDirector), so a
 * sign that's switched off still shows its glass tubes.
 */

export type NeonFont = "script" | "tube" | "deco" | (string & {});

/** Named lettering styles; any other value is used as a CSS font-family. */
const FONTS: Record<string, { family?: string; tube?: number; solid?: boolean }> = {
  tube: { tube: 7 }, // the original monoline tube alphabet
  script: { family: "var(--font-yellowtail), cursive", tube: 2.6, solid: true },
  deco: { family: "var(--font-limelight), serif", tube: 2.2 },
};

type Material = {
  /** tube light, 0–2 (1 = as designed) */
  intensity?: number;
  /** wall glow, 0–2 */
  glow?: number;
  /** glass reflections, 0–1 */
  glass?: number;
  /** tube diameter in glyph units; defaults per font */
  tubeWidth?: number;
};

type Props = Material & {
  children: string;
  /** lettering: "script" (site default), "tube", "deco" or any CSS font-family; defaults to the visitor's choice */
  font?: NeonFont;
  /** any CSS colour or variable; defaults to the site's neon colour */
  color?: string;
  /** word-rise entrance, in ms of delay (hero) */
  rise?: number;
  className?: string;
  style?: CSSProperties;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ── Geometry ─────────────────────────────────────────── */
// Tube alphabet: cap height 100 units, drawn at a 0.7em cap height.
const TUBE_UNITS_PER_EM = 100 / 0.7;
const TUBE_TOP = -14;
const TUBE_BOTTOM = 114;
const TUBE_TRACKING = 9;
// Web fonts: drawn at font-size 100, so 100 units = 1em of the surrounding text.
const FONT_TOP = -100;
const FONT_BOTTOM = 36;
const SIDE_PAD = 8;

function tubeWord(word: string) {
  let x = 0;
  const glyphs = Array.from(word).map((ch) => {
    const [advance, d] = TUBE_GLYPHS[ch] ?? TUBE_FALLBACK;
    const g = { d, x };
    x += advance + TUBE_TRACKING;
    return g;
  });
  return { glyphs, width: Math.max(0, x - TUBE_TRACKING) };
}

/* ── Material ─────────────────────────────────────────── */
function NeonMaterial({
  id,
  box,
  shape,
  solid,
  intensity = 1,
  glow = 1,
  glass = 0.72,
  tubeWidth = 7,
}: Material & { id: string; box: [number, number, number, number]; shape: ReactNode; solid?: boolean }) {
  const light = clamp(intensity, 0, 2);
  const halo = clamp(glow, 0, 2);
  const refl = clamp(glass, 0, 1);
  const m = clamp(tubeWidth, 1, 14);
  const [x, y, w, h] = box;
  const region = { x: x - 110, y: y - 110, width: w + 220, height: h + 220, filterUnits: "userSpaceOnUse", colorInterpolationFilters: "sRGB" } as const;
  const url = (name: string) => `url(#${id}-${name})`;
  const layer = (stroke: string, width: number, extra: Record<string, unknown> = {}) => (
    <use href={`#${id}-shape`} stroke={stroke} fill={solid ? stroke : "none"} strokeWidth={width} {...extra} />
  );

  return (
    <>
      <defs>
        <g id={`${id}-shape`} strokeLinecap="round" strokeLinejoin="round">
          {shape}
        </g>
        <filter id={`${id}-spill`} {...region}>
          <feGaussianBlur stdDeviation={m * 3.4 * (solid ? 1.6 : 1)} />
        </filter>
        <filter id={`${id}-halo`} {...region}>
          <feGaussianBlur stdDeviation={m * 0.95 * (solid ? 1.6 : 1)} />
        </filter>
        <filter id={`${id}-aura`} {...region}>
          <feGaussianBlur stdDeviation={m * 0.25} />
        </filter>
        <filter id={`${id}-shadow`} {...region}>
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id={`${id}-glass`} {...region}>
          <feGaussianBlur in="SourceAlpha" stdDeviation={m * 0.18} result="height" />
          <feSpecularLighting in="height" surfaceScale={m * 0.85} specularConstant="0.9" specularExponent="28" lightingColor="#fff" result="reflection">
            <feDistantLight azimuth="235" elevation="48" />
          </feSpecularLighting>
          <feComposite in="reflection" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>

      {/* glass, always visible */}
      <g className="ngn-under">
        {layer("#000", m * 1.5, { transform: "translate(2.3 4.5)", filter: url("shadow"), opacity: 0.65 })}
        {layer("var(--neon-glass-tint, #161012)", m * 1.42)}
        {layer("currentColor", m * 1.25, { opacity: 0.16 })}
        {layer("#05070a", m * 0.93, { opacity: 0.48, transform: "translate(0.8 1.1)" })}
      </g>

      {/* the light: ignites, flickers, switches off */}
      <g className="ngn-light">
        <g className="ngn-glow">
          {layer("currentColor", m * 3.2, { filter: url("spill"), opacity: Math.min(0.66, light * halo * 0.27) })}
          {layer("currentColor", m * 1.6, { filter: url("halo"), opacity: Math.min(0.9, light * halo * 0.42) })}
        </g>
        {layer("currentColor", m * 1.25, { opacity: 0.31 })}
        {layer("currentColor", m * 1.15, { filter: url("aura"), opacity: Math.min(1, light * 0.75) })}
        {layer("currentColor", m * 0.84, { opacity: Math.min(1, light) })}
        {layer("#fff", m * 0.49, { opacity: Math.min(0.85, light * 0.59) })}
        {layer("#fff", m * 0.18, { opacity: Math.min(0.58, light * 0.37) })}
      </g>

      {/* reflections on the glass */}
      <g className="ngn-over">
        {layer("#fff", m * 1.35, { filter: url("glass"), opacity: refl * 0.9 })}
        {layer("#fff", m * 0.1, { transform: `translate(${-m * 0.29} ${-m * 0.26})`, strokeDasharray: "11 28 3 39 19 61", opacity: refl * 0.54, fill: "none" })}
      </g>
    </>
  );
}

/* ── One word = one sign ──────────────────────────────── */
function TubeWord({ word, material, id }: { word: string; material: Material; id: string }) {
  const { glyphs, width } = tubeWord(word);
  const vbW = width + SIDE_PAD * 2;
  const vbH = TUBE_BOTTOM - TUBE_TOP;
  const style: CSSProperties = {
    width: `${vbW / TUBE_UNITS_PER_EM}em`,
    height: `${vbH / TUBE_UNITS_PER_EM}em`,
    verticalAlign: `${-(TUBE_BOTTOM - 100) / TUBE_UNITS_PER_EM}em`,
  };
  return (
    <svg className="ngn-word" viewBox={`${-SIDE_PAD} ${TUBE_TOP} ${vbW} ${vbH}`} style={style} aria-hidden="true" focusable="false">
      <NeonMaterial
        id={id}
        box={[0, 0, width, 100]}
        shape={glyphs.map((g, i) => g.d && <path key={i} d={g.d} transform={`translate(${g.x} 0)`} />)}
        {...material}
      />
    </svg>
  );
}

function FontWord({ word, family, solid, material, id }: { word: string; family: string; solid?: boolean; material: Material; id: string }) {
  const ref = useRef<SVGTextElement>(null);
  // first paint uses an estimate; the real advance is measured once the font is ready
  const [width, setWidth] = useState(() => Array.from(word).length * 46);

  useLayoutEffect(() => {
    let live = true;
    const measure = () => {
      const t = ref.current;
      if (!live || !t) return;
      const w = t.getComputedTextLength();
      if (w > 0) setWidth(w);
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      live = false;
    };
  }, [word, family]);

  const vbW = width + SIDE_PAD * 2;
  const vbH = FONT_BOTTOM - FONT_TOP;
  const style: CSSProperties = { width: `${vbW / 100}em`, height: `${vbH / 100}em`, verticalAlign: `${-FONT_BOTTOM / 100}em` };
  return (
    <svg className="ngn-word" viewBox={`${-SIDE_PAD} ${FONT_TOP} ${vbW} ${vbH}`} style={style} aria-hidden="true" focusable="false">
      <NeonMaterial
        id={id}
        box={[0, -80, width, 100]}
        solid={solid}
        shape={
          <text ref={ref} x="0" y="0" fontSize="100" style={{ fontFamily: family }}>
            {word}
          </text>
        }
        {...material}
      />
    </svg>
  );
}

export function NeonSign({ children: text, font, color, rise, className, style, intensity, glow, glass, tubeWidth }: Props) {
  const neon = useNeon();
  const base = `ngn${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const key = font ?? neon.font;
  const preset = FONTS[key] ?? { family: key, tube: 2.4 };
  const material: Material = { intensity, glow, glass: glass ?? 0.85, tubeWidth: tubeWidth ?? preset.tube };
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span className={["ng-neon-sign", className].filter(Boolean).join(" ")} data-font={key} style={{ color: color ?? "var(--hl)", ...style }}>
      <span className="ng-sr">{text}</span>
      {words.map((w, i) => {
        const id = `${base}-${i}`;
        const sign = preset.family ? (
          <FontWord word={w} family={preset.family} solid={preset.solid} material={material} id={id} />
        ) : (
          <TubeWord word={w} material={material} id={id} />
        );
        return (
          <Fragment key={`${key}-${i}`}>
            {i > 0 && " "}
            {rise === undefined ? (
              sign
            ) : (
              <span className="ng-rise-mask ngn-rise" aria-hidden="true">
                <span className="ng-rise-word" style={{ animationDelay: `${rise + i * 70}ms` }}>
                  {sign}
                </span>
              </span>
            )}
          </Fragment>
        );
      })}
    </span>
  );
}
