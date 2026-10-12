"use client";

import { NextGenWavesLazy } from "@/components/nextgen-waves/NextGenWavesLazy";
import { HarmonicField } from "./HarmonicField";

/**
 * The waves behind the hero and the footer CTA, in one place.
 *
 * "nextgen"  — the production R3F component (src/components/nextgen-waves), lazy-loaded.
 * "harmonic" — the original HarmonicField, kept as a fallback. Without a three.js
 *              global on the page it draws its own Canvas 2D version.
 *
 * Switch back by changing this one line.
 */
const ENGINE: "nextgen" | "harmonic" = "nextgen";

type Props = { className?: string; density?: number; intensity?: number };

export function SiteWaves(props: Props) {
  return ENGINE === "harmonic" ? <HarmonicField {...props} /> : <NextGenWavesLazy {...props} />;
}
