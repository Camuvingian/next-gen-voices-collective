"use client";

import type { CSSProperties } from "react";
import { Marquee } from "@/components/noir-motion/Controls";
import { FOUNDER_CREDITS } from "@/lib/media";

/** logo height, in rem, for a logo of average shape; wide ones get shorter, tall ones taller */
const H = 3.3;

/**
 * The founder's credits (artists, shows, venues, brands) as the home page's
 * Noir ticker, with logos in place of words. The logos are white-on-clear
 * images used as CSS masks, so each is painted in silver or in the neon
 * colour the visitor picked, and lights up when hovered (noir.css).
 */
export function CreditsRibbon() {
  const byName = new Map(FOUNDER_CREDITS.map((c) => [c.name, c]));
  return (
    <Marquee
      className="ng-credits"
      speed={46}
      items={FOUNDER_CREDITS.map((c) => c.name)}
      renderItem={(name) => {
        const c = byName.get(name)!;
        const aspect = c.width / c.height;
        // even out the visual weight: equal-ish area whatever the shape
        const h = H * Math.min(1.3, Math.max(0.62, Math.sqrt(1.9 / aspect)));
        return (
          <span
            className="ng-credit"
            title={name}
            style={{ "--logo": `url(${c.src})`, height: `${h}rem`, width: `${h * aspect}rem` } as CSSProperties}
          />
        );
      }}
    />
  );
}
