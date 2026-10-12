import type { CSSProperties } from "react";
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
      <LogoMark size={markSize} draw={draw} decorative duration={6} />
      <span className="ng-wordmark" aria-hidden="true">
        <span className="ng-wordmark-top">NEXTGEN</span>
        <span className="ng-wordmark-bottom">Voice Collective</span>
      </span>
    </span>
  );
}
