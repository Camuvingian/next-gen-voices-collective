"use client";

import { Marquee as NoirMarquee } from "@/components/noir-motion/Controls";
import { PillarCard as NoirPillarCard } from "@/components/noir-motion/PillarCard";
import { PillarCard, type PillarKind } from "./PillarCard";
import { Marquee } from "./primitives";

/**
 * The musical scene cards and the ticker ribbon, each with one switch, like
 * SiteWaves.
 *
 * "noir"    — the Noir motion versions (src/components/noir-motion): engraved
 *             scene cards on one shared clock, and a measured, seamless ticker.
 * "classic" — the originals (./PillarCard and Marquee in ./primitives), kept as
 *             a fallback.
 */
const SCENES: "noir" | "classic" = "noir";
const TICKER: "noir" | "classic" = "noir";

export function SitePillarCard({ kind }: { kind: PillarKind }) {
  return SCENES === "classic" ? <PillarCard kind={kind} /> : <NoirPillarCard kind={kind} />;
}

export function SiteMarquee({ items }: { items: string[] }) {
  return TICKER === "classic" ? <Marquee items={items} /> : <NoirMarquee items={items} />;
}
