"use client";

import { useRef } from "react";
import { NextGenWavesLazy, type NextGenWavesHandle } from "./NextGenWavesLazy";

/** Hero: full-bleed behind the headline. The parent must be positioned. */
export function HeroExample() {
  const waves = useRef<NextGenWavesHandle>(null);
  return (
    <section style={{ position: "relative", minHeight: "100svh", overflow: "hidden", isolation: "isolate" }}>
      <NextGenWavesLazy ref={waves} style={{ zIndex: -2 }} onPluck={(x) => console.log("pluck at", x)} />
      <h1>
        Young voices. <em>One sound.</em>
      </h1>
      {/* any UI can pluck the waves, e.g. a piano key */}
      <button onClick={() => waves.current?.pluck(0.5, 1.2)}>Play a chord</button>
    </section>
  );
}

/** Footer CTA: lighter field, no clicks needed. */
export function FooterExample() {
  return (
    <section style={{ position: "relative", padding: "160px 0", overflow: "hidden", isolation: "isolate" }}>
      <NextGenWavesLazy density={10} intensity={0.8} style={{ zIndex: -1, opacity: 0.8 }} />
      <h2>Think you&rsquo;ve got the voice and the work ethic?</h2>
    </section>
  );
}
