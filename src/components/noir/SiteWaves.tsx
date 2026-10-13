"use client";

import { NextGenWavesLazy } from "@/components/nextgen-waves/NextGenWavesLazy";
import { HarmonicField as NoirWaves } from "@/components/noir-motion/HarmonicField";
import { HarmonicField } from "./HarmonicField";

/**
 * The waves behind the hero and the footer CTA, in one place.
 *
 * "noir"     — the Noir motion Canvas 2D field (src/components/noir-motion): eased
 *              conducting, tap ripples, major/minor breathing. No three.js.
 * "nextgen"  — the R3F component (src/components/nextgen-waves), lazy-loaded.
 * "harmonic" — the original HarmonicField. Without a three.js global on the page
 *              it draws its own Canvas 2D version.
 *
 * Switch by changing this one line.
 */
const ENGINE: "noir" | "nextgen" | "harmonic" = "noir";

type Props = { className?: string; density?: number; intensity?: number };

export function SiteWaves(props: Props) {
  if (ENGINE === "harmonic") return <HarmonicField {...props} />;
  if (ENGINE === "nextgen") return <NextGenWavesLazy {...props} />;
  return <NoirWaves {...props} />;
}
