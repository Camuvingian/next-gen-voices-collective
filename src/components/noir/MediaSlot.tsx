"use client";

import Image from "next/image";
import { useId, useMemo } from "react";
import type { Photo } from "@/lib/media";

/**
 * MediaSlot — art-directed placeholder for the Collective's own photos/video.
 * Every slot states what should go in it (`brief`) so swapping in real
 * assets is a 1:1 job. In production: <Image src=… /> (next/image) or a
 * Mux <MuxPlayer/> with the same aspect + caption props.
 */

export type MediaKind = "stage" | "portrait" | "beams" | "rehearsal";

type Props = {
  kind?: MediaKind;
  seed?: number;
  ratio?: string; // CSS aspect-ratio
  brief?: string; // what the real asset should be
  caption?: string;
  className?: string;
  showBrief?: boolean;
  video?: boolean;
  /** a real photo; without one the slot shows its art-directed placeholder */
  photo?: Photo;
  sizes?: string;
};

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Figure({ x, y, s, tone }: { x: number; y: number; s: number; tone: string }) {
  // head + shoulders silhouette
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={tone}>
      <ellipse cx="0" cy="-34" rx="9" ry="11" />
      <path d="M-24 40 C-24 6 -14 -18 0 -18 C14 -18 24 6 24 40 Z" />
    </g>
  );
}

export function MediaSlot({
  kind = "stage",
  seed = 1,
  ratio = "4 / 3",
  brief,
  caption,
  className,
  showBrief = true,
  video = false,
  photo,
  sizes = "(max-width: 700px) 100vw, 50vw",
}: Props) {
  const img = photo;
  const uid = useId().replace(/:/g, "");
  const art = useMemo(() => {
    const r = rng(seed);
    const lightX = 20 + r() * 60;
    const figures: { x: number; y: number; s: number; row: number }[] = [];
    if (kind === "stage" || kind === "rehearsal") {
      const rows = kind === "stage" ? 3 : 2;
      for (let row = 0; row < rows; row++) {
        const count = kind === "stage" ? 7 + row * 2 + Math.floor(r() * 2) : 4 + row * 2;
        const y = 250 + row * 34 + (kind === "rehearsal" ? 20 : 0);
        const s = 0.75 + row * 0.18;
        for (let i = 0; i < count; i++) {
          const x = ((i + 0.5) / count) * 400 + (r() - 0.5) * 16 + (row % 2 ? 10 : -10);
          figures.push({ x, y: y + (r() - 0.5) * 6, s: s + (r() - 0.5) * 0.08, row });
        }
      }
    } else if (kind === "portrait") {
      figures.push({ x: 160 + r() * 80, y: 260, s: 3.4, row: 2 });
    }
    return { lightX, figures, tilt: (r() - 0.5) * 30 };
  }, [kind, seed]);

  return (
    <figure className={["ng-media", className].join(" ")} style={{ aspectRatio: ratio }}>
      {img ? (
        <Image src={img.src} alt={img.alt} fill sizes={sizes} style={{ objectFit: "cover", objectPosition: img.focus }} />
      ) : (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id={`l${uid}`} cx={`${art.lightX}%`} cy="10%" r="85%">
              <stop offset="0" stopColor="rgb(var(--ng-light))" stopOpacity="0.95" />
              <stop offset="0.45" stopColor="rgb(var(--ng-light))" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--ng-bg-sunken)" stopOpacity="1" />
            </radialGradient>
            <linearGradient id={`b${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--ng-glow-2))" stopOpacity="0.32" />
              <stop offset="1" stopColor="rgb(var(--ng-glow-2))" stopOpacity="0" />
            </linearGradient>
            <filter id={`g${uid}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.10 0" />
            </filter>
          </defs>
          <rect width="400" height="300" fill="var(--ng-bg-sunken)" />
          <rect width="400" height="300" fill={`url(#l${uid})`} />
          {(kind === "beams" || kind === "stage") && (
            <g style={{ mixBlendMode: "screen" }} opacity={kind === "beams" ? 0.9 : 0.45}>
              {[0, 1, 2].map((i) => (
                <polygon
                  key={i}
                  points={`${art.lightX * 4 - 12 + i * 6},-10 ${art.lightX * 4 + 12 + i * 6},-10 ${80 + i * 130 + art.tilt},310 ${10 + i * 130 + art.tilt},310`}
                  fill={`url(#b${uid})`}
                />
              ))}
            </g>
          )}
          {art.figures.map((f, i) => (
            <Figure key={i} x={f.x} y={f.y} s={f.s} tone="var(--ng-bg-sunken)" />
          ))}
          <rect y="270" width="400" height="30" fill="var(--ng-bg-sunken)" opacity="0.7" />
          <rect width="400" height="300" filter={`url(#g${uid})`} />
        </svg>
      )}
      {video && (
        <span className="ng-media-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M9 5.5v13l10-6.5z" fill="currentColor" />
          </svg>
        </span>
      )}
      {!img && showBrief && brief && <span className="ng-media-brief">{video ? "Video" : "Photo"} · {brief}</span>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
