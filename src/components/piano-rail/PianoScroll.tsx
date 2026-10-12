"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useNeon } from "@/components/neon/NeonProvider";

// the rail (and, on first key press, its samples) only downloads once Piano Scroll is switched on
const NextGenPianoRail = dynamic(() => import("./NextGenPianoRail").then((m) => m.NextGenPianoRail), { ssr: false });

/**
 * Piano Scroll: the Piano Rail down the left edge, driven by the "Piano Scroll"
 * switch in the neon menu (off by default). As the page scrolls, a chord walks
 * down the keys, so the keyboard doubles as a scroll-progress indicator.
 */
export function PianoScroll() {
  const { piano, set } = useNeon();
  // stay mounted after the first switch-on so the rail can slide out again
  const [mounted, setMounted] = useState(piano);
  if (piano && !mounted) setMounted(true);
  if (!mounted) return null;
  return <NextGenPianoRail open={piano} onOpenChange={(v) => set("piano", v)} showToggle={false} persistKey={null} />;
}
