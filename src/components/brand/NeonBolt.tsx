"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

/**
 * NeonBolt: a lightning-bolt neon sign over a spray-painted bolt, lifted from
 * media/neon-bolt-preview.html.
 *
 * Sequence (seconds after `delay`, all scaled by `pace`):
 *   0.1  the spray-paint bolt is sprayed on, top to bottom; paint drips run
 *   1.1  a white spark races round the dark glass tube
 *   1.9  the tube ignites with a stutter and a flash (`onStrike` fires here)
 *   2.7  then an occasional buzz (every 7 s)
 *
 * Site changes from the preview:
 *  - the colour follows the site neon colour (--hl) unless `color` is given
 *  - the neon power switch in the menu turns the light off (glass and paint stay)
 *  - `pace` speeds the whole sequence up (the page curtains use it)
 *  - styles live in NeonBolt.css instead of an inline <style> per instance
 */

const BOLT =
  "M126 70 L206 70 Q222 70 215.7 84.7 L184.3 158.3 Q178 173 194 173 L222 173 Q238 173 228.7 186 L106.2 357.1 Q102 363 104.1 356.1 L133.3 260.3 Q138 245 122 245 L88 245 Q72 245 75.4 229.4 L106.6 85.6 Q110 70 126 70 Z";
/** the spray can's path: zig-zags down the bolt, revealing the paint through a mask */
const SPRAY = "M95 40 L245 50 L75 120 L255 145 L60 210 L250 195 L65 270 L170 275 L95 390";
const DRIPS = [
  { d: "M72 253 C72 273 73 293 72.6 323", w: 5.5, t: 0.8 },
  { d: "M114 255 C114 265 114.6 275 114.3 289", w: 4, t: 1 },
  { d: "M94 369 C94.5 397 95.6 427 95 465", w: 6.5, t: 1.1 },
];
/** tube diameter, in bolt units */
const M = 10;

type Props = {
  /** any CSS colour; defaults to the site neon colour */
  color?: string;
  /** "mount" plays straight away; "inView" waits until a third of it is on screen */
  trigger?: "mount" | "inView";
  /** the spray-painted bolt and drips behind the tube */
  spray?: boolean;
  /** the occasional buzz after ignition */
  buzz?: boolean;
  /** seconds before the sequence starts */
  delay?: number;
  /** multiplies every timing (0.5 = twice as fast) */
  pace?: number;
  className?: string;
  style?: CSSProperties;
  /** accessible name; pass null when the bolt is decorative */
  label?: string | null;
  /** the moment the tube ignites, with the bolt's on-screen centre */
  onStrike?: (centre: { x: number; y: number }) => void;
};

export function NeonBolt({ color, trigger = "inView", spray = true, buzz = true, delay = 0, pace = 1, className, style, label = "Lightning bolt", onStrike }: Props) {
  const id = "nb" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(trigger === "mount");

  useEffect(() => {
    if (on) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return void queueMicrotask(() => setOn(true));
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on]);

  const url = (name: string) => `url(#${id}-${name})`;
  const at = (s: number) => `${delay + s * pace}s`;
  const region = { x: -120, y: -80, width: 500, height: 640, filterUnits: "userSpaceOnUse" } as const;
  const tube = (extra: Record<string, unknown>) => <use href={`#${id}-bolt`} {...extra} />;
  const vars = {
    "--nb-p": pace,
    "--nb-d0": at(0.1),
    "--nb-d1": at(1.1),
    "--nb-d2": at(1.9),
    "--nb-d3": at(2.05),
    "--nb-d4": at(2.7),
  } as CSSProperties;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="30 40 240 440"
      className={["nb-root", on && "nb-on", className].filter(Boolean).join(" ")}
      style={{ color: color ?? "var(--hl)", ...vars, ...style }}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <path id={`${id}-bolt`} d={BOLT} pathLength={1} />
        <filter id={`${id}-shadow`} {...region}>
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id={`${id}-spill`} {...region}>
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id={`${id}-halo`} {...region}>
          <feGaussianBlur stdDeviation="8.5" />
        </filter>
        <filter id={`${id}-aura`} {...region}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id={`${id}-glass`} {...region}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="h" />
          <feSpecularLighting in="h" surfaceScale="8.5" specularConstant="0.9" specularExponent="28" lightingColor="#fff" result="r">
            <feDistantLight azimuth="235" elevation="48" />
          </feSpecularLighting>
          <feComposite in="r" in2="SourceAlpha" operator="in" />
        </filter>
        {spray && (
          <>
            <filter id={`${id}-paint`} {...region}>
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="w" />
              <feDisplacementMap in="SourceGraphic" in2="w" scale="12" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="3" result="g" />
              <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.55" result="ga" />
              <feComposite in="d" in2="ga" operator="in" />
            </filter>
            <filter id={`${id}-mist`} {...region}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b" />
              <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="11" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 7 -3.9" result="dots" />
              <feComposite in="b" in2="dots" operator="in" result="sp" />
              <feGaussianBlur in="b" stdDeviation="3" result="haze" />
              <feComponentTransfer in="haze" result="haze2">
                <feFuncA type="linear" slope="0.35" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="haze2" />
                <feMergeNode in="sp" />
              </feMerge>
            </filter>
            <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" x={-60} y={-60} width={420} height={600}>
              <path className="nb-rv" d={SPRAY} pathLength={1} stroke="#fff" strokeWidth={96} />
            </mask>
          </>
        )}
        <radialGradient id={`${id}-flash`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="nb-flash" cx="155" cy="215" r="230" fill={url("flash")} />

      {/* spray paint on the wall */}
      {spray && (
        <g>
          <g mask={url("reveal")}>
            <g transform="translate(-11 9)">
              {tube({ className: "nb-paint", strokeWidth: 44, opacity: 0.75, filter: url("mist") })}
              {tube({ className: "nb-paint", strokeWidth: 6, filter: url("paint") })}
              {tube({ className: "nb-pale", strokeWidth: 14, opacity: 0.22, transform: "translate(-3 -4)", filter: url("mist") })}
            </g>
          </g>
          {DRIPS.map((p) => (
            <path key={p.d} className="nb-drip nb-paint" d={p.d} pathLength={1} strokeWidth={p.w} style={{ animationDelay: at(p.t) }} />
          ))}
        </g>
      )}

      {/* glass, always visible */}
      {tube({ stroke: "#000", strokeWidth: M * 1.5, opacity: 0.65, transform: "translate(2.3 4.5)", filter: url("shadow") })}
      {tube({ stroke: "#101b23", strokeWidth: M * 1.42 })}
      {tube({ stroke: "currentColor", strokeWidth: M * 1.25, opacity: 0.16 })}
      {tube({ stroke: "#05070a", strokeWidth: M * 0.93, opacity: 0.48, transform: "translate(0.8 1.1)" })}

      {/* the light */}
      <g
        className="nb-ignite"
        onAnimationStart={(e) => {
          if (e.animationName !== "nb-ignite" || !onStrike || document.documentElement.dataset.neon === "off") return;
          const r = ref.current?.getBoundingClientRect();
          if (r) onStrike({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }}
      >
        <g className={buzz ? "nb-buzz" : undefined}>
          {tube({ stroke: "currentColor", strokeWidth: M * 3.2, opacity: 0.42, filter: url("spill") })}
          {tube({ stroke: "currentColor", strokeWidth: M * 1.6, opacity: 0.6, filter: url("halo") })}
          {tube({ stroke: "currentColor", strokeWidth: M * 1.15, opacity: 0.78, filter: url("aura") })}
          {tube({ stroke: "currentColor", strokeWidth: M * 1.25, opacity: 0.26 })}
          {tube({ stroke: "currentColor", strokeWidth: M * 0.84 })}
          {tube({ stroke: "#fff", strokeWidth: M * 0.49, opacity: 0.62 })}
          {tube({ stroke: "#fff", strokeWidth: M * 0.18, opacity: 0.42 })}
        </g>
      </g>

      {/* reflections on the glass */}
      {tube({ stroke: "#fff", strokeWidth: M * 1.35, opacity: 0.6, filter: url("glass") })}
      {tube({ stroke: "#fff", strokeWidth: M * 0.1, opacity: 0.45, strokeDasharray: ".05 .12 .015 .16 .08 .25", transform: "translate(-2.6 -2.3)" })}

      {/* the spark that runs round the tube before it lights */}
      {tube({ className: "nb-trace", stroke: "currentColor", strokeWidth: M, filter: url("aura") })}
      {tube({ className: "nb-trace", stroke: "#fff", strokeWidth: M * 0.42 })}
    </svg>
  );
}
