"use client";

import type { CSSProperties } from "react";
import { useNeon } from "@/components/neon/NeonProvider";
import { NeonBolt } from "./NeonBolt";
import { NextGenLogo } from "./NextGenLogo";

/**
 * Site wrappers around the approved NextGen Interlock asset (NextGenLogo.tsx).
 * Colours come from the site tokens via the five --ng-* logo variables mapped
 * in tokens.css (accent, secondary, edge, surface, shine), so the mark follows
 * the theme and highlight switches without restarting its animation.
 */

export { NextGenLogo };

type MarkProps = {
  size?: number | string;
  className?: string;
  /** play the draw → settle → shimmer → hold sequence (once, then hold) */
  draw?: boolean;
  delay?: number;
  duration?: number;
  replayKey?: string | number;
  decorative?: boolean;
  style?: CSSProperties & Partial<Record<`--ng-${string}`, string | number>>;
};

export function LogoMark({ size = 48, className, draw = false, delay = 0, duration = 8, replayKey, decorative = false, style }: MarkProps) {
  return (
    <NextGenLogo
      size={size}
      className={className}
      animated={draw}
      delay={delay}
      duration={duration}
      replayKey={replayKey}
      decorative={decorative}
      style={style}
    />
  );
}

/**
 * The brand mark in the style chosen under "Logo" in the site menu: the neon
 * lightning bolt, or the NG interlock. `size` is the interlock's width; the
 * bolt is drawn about as tall as the interlock is wide.
 */
export function BrandMark({
  size = 48,
  draw = false,
  delay = 0,
  pace = 1,
  replayKey,
  spray = true,
  ...interlock
}: Omit<MarkProps, "size"> & { size?: number; pace?: number; spray?: boolean }) {
  const { logo } = useNeon();
  if (logo === "classic") return <LogoMark size={size} draw={draw} delay={delay} replayKey={replayKey} {...interlock} />;
  return (
    <NeonBolt
      key={replayKey}
      className={["ng-brand-bolt", interlock.className].filter(Boolean).join(" ")}
      style={{ height: size * 1.25, width: size * 0.68 }}
      trigger="mount"
      // a mark that doesn't draw shows the finished, lit sign
      delay={draw ? delay : -10}
      pace={pace}
      spray={spray}
      buzz={false}
      label={null}
    />
  );
}

type LockupProps = {
  className?: string;
  markSize?: number;
  stacked?: boolean;
  draw?: boolean;
};

/** Mark + wordmark. Horizontal for nav, stacked for footer. The parent link carries the accessible name. */
export function Logo({ className, markSize = 34, stacked = false, draw = true }: LockupProps) {
  return (
    <span className={["ng-lockup", stacked ? "is-stacked" : "", className].join(" ")}>
      <BrandMark size={markSize} draw={draw} decorative duration={6} pace={0.75} spray={stacked} />
      <span className="ng-wordmark" aria-hidden="true">
        <span className="ng-wordmark-top">NEXTGEN</span>
        <span className="ng-wordmark-bottom">Voice Collective</span>
      </span>
    </span>
  );
}
