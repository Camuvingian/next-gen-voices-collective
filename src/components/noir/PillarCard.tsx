"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type PillarKind = "blend" | "harmony" | "precision" | "presence";

/**
 * PillarCard: the four pillar graphics. Each one is a little animated card
 * in the language of sheet music and the supper-club stage:
 *   blend      three notes glide together and land as one unison note
 *   harmony    C, E, G arpeggiate, then ring out together as a chord
 *   precision  a metronome swings; the beat lights land exactly on the tick
 *   presence   a spotlight finds the mic and the sound carries out
 * SVG + CSS keyframes (src/theme/noir.css, "Noir pillar cards"), paused when offscreen.
 */

const STAFF = [60, 75, 90, 105, 120];
const LABELS: Record<PillarKind, string> = {
  blend: "Unison",
  harmony: "C · E · G",
  precision: "♩ = 100",
  presence: "Spotlight",
};

function Note({ x, y, stem = true, className, style }: { x: number; y: number; stem?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <g className={className} style={style}>
      <ellipse cx={x} cy={y} rx={8.5} ry={6} transform={`rotate(-20 ${x} ${y})`} />
      {stem && <line x1={x + 7.6} y1={y - 2} x2={x + 7.6} y2={y - 44} />}
    </g>
  );
}

function Frame() {
  // double rule with art-deco corner fans
  const fan = (cx: number, cy: number, sx: number, sy: number) => (
    <g transform={`translate(${cx} ${cy}) scale(${sx} ${sy})`}>
      {[8, 14, 20].map((r) => (
        <path key={r} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} />
      ))}
    </g>
  );
  return (
    <g className="ng-jg-frame">
      <rect x="6" y="6" width="308" height="168" rx="4" />
      <rect x="11" y="11" width="298" height="158" rx="2" className="ng-jg-frame-inner" />
      {fan(11, 11, 1, 1)}
      {fan(309, 11, -1, 1)}
      {fan(11, 169, 1, -1)}
      {fan(309, 169, -1, -1)}
    </g>
  );
}

function Staff({ from = 30, to = 290 }: { from?: number; to?: number }) {
  return (
    <g className="ng-jg-staff">
      {STAFF.map((y) => (
        <line key={y} x1={from} x2={to} y1={y} y2={y} />
      ))}
    </g>
  );
}

function Blend() {
  const starts = [
    { y: 60, dy: 30 },
    { y: 90, dy: 0 },
    { y: 120, dy: -30 },
  ];
  return (
    <>
      <Staff />
      <g className="ng-jg-guides">
        {starts.map((s, i) => (
          <path key={i} d={`M 78 ${s.y} C 150 ${s.y}, 170 90, 232 90`} pathLength={1} />
        ))}
      </g>
      {starts.map((s, i) => (
        <Note
          key={i}
          x={70}
          y={s.y}
          className={`ng-jg-note ng-jg-glide ${i === 1 ? "is-accent" : ""}`}
          style={{ ["--dy" as string]: `${s.dy}px`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
      <Note x={240} y={90} className="ng-jg-note is-accent ng-jg-unison" />
      <circle cx={240} cy={90} r={14} className="ng-jg-ring" />
    </>
  );
}

function Harmony() {
  const arp = [
    { x: 80, y: 135 },
    { x: 125, y: 120 },
    { x: 170, y: 105 },
  ];
  return (
    <>
      <Staff />
      <g className="ng-jg-staff">
        <line x1={70} x2={92} y1={135} y2={135} />
        <line x1={225} x2={258} y1={135} y2={135} />
      </g>
      {arp.map((n, i) => (
        <Note key={i} x={n.x} y={n.y} className="ng-jg-note ng-jg-pop" style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
      <g className="ng-jg-chord">
        <ellipse cx={240} cy={135} rx={8.5} ry={6} transform="rotate(-20 240 135)" />
        <ellipse cx={240} cy={120} rx={8.5} ry={6} transform="rotate(-20 240 120)" />
        <ellipse cx={240} cy={105} rx={8.5} ry={6} transform="rotate(-20 240 105)" />
        <line x1={247.6} y1={133} x2={247.6} y2={62} />
      </g>
      {[0, 1, 2].map((i) => (
        <path key={i} className="ng-jg-wave" d="M 262 92 a 26 26 0 0 1 0 46" style={{ animationDelay: `${1.6 + i * 0.25}s` }} />
      ))}
    </>
  );
}

function Precision() {
  return (
    <>
      <g className="ng-jg-metro">
        <path d="M 128 148 L 192 148 L 176 34 Q 160 26 144 34 Z" className="ng-jg-metro-body" />
        <line x1={136} y1={118} x2={184} y2={118} className="ng-jg-metro-scale" />
        <g className="ng-jg-arm">
          <line x1={160} y1={136} x2={160} y2={44} />
          <rect x={153} y={70} width={14} height={10} rx={2} />
        </g>
        <circle cx={160} cy={136} r={3.5} className="ng-jg-pivot" />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={112 + i * 32} cy={163} r={4.5} className="ng-jg-beat" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
    </>
  );
}

function Presence({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`spot-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ng-accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--ng-accent)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <polygon points="160,4 112,150 208,150" fill={`url(#spot-${uid})`} className="ng-jg-spot" />
      <ellipse cx={160} cy={150} rx={52} ry={7} className="ng-jg-pool" />
      <line x1={30} x2={290} y1={150} y2={150} className="ng-jg-floor" />
      <g className="ng-jg-mic">
        <line x1={160} y1={150} x2={160} y2={92} />
        <line x1={148} y1={150} x2={172} y2={150} />
        <rect x={153} y={68} width={14} height={24} rx={7} />
        <line x1={156} y1={76} x2={164} y2={76} className="ng-jg-mic-grille" />
        <line x1={156} y1={82} x2={164} y2={82} className="ng-jg-mic-grille" />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="ng-jg-carry" style={{ animationDelay: `${i * 0.7}s` }}>
          <path d="M 180 66 a 18 18 0 0 1 0 28" />
          <path d="M 140 66 a 18 18 0 0 0 0 28" />
        </g>
      ))}
    </>
  );
}

export function PillarCard({ kind }: { kind: PillarKind }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(true);
  const uid = kind;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setRun(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ng-jg ng-jg--${kind}`} data-run={run ? "true" : "false"} aria-hidden="true">
      <svg viewBox="0 0 320 180" fill="none">
        <Frame />
        {kind === "blend" && <Blend />}
        {kind === "harmony" && <Harmony />}
        {kind === "precision" && <Precision />}
        {kind === "presence" && <Presence uid={uid} />}
      </svg>
      <span className="ng-jg-label">{LABELS[kind]}</span>
    </div>
  );
}
