"use client";
import { useState } from "react";
import { NextGenPianoRail } from "./NextGenPianoRail";

/** Usage example: controlled rail with an external button, plus a tall page to scroll. */
export function PianoRailExample() {
  const [open, setOpen] = useState(true);
  return (
    <main className="ngp-demo">
      <NextGenPianoRail open={open} onOpenChange={setOpen} persistKey={null} />
      <header>
        <p className="ngp-demo-eyebrow">NextGen asset</p>
        <h1>Piano Rail</h1>
        <p>Scroll to move the chord down the keys. Press, hold or drag across the keys to play. Turn on ♪ to let scrolling play the notes.</p>
        <button type="button" onClick={() => setOpen((o) => !o)}>{open ? "Hide piano" : "Show piano"} (external control)</button>
      </header>
      {Array.from({ length: 8 }, (_, i) => (
        <section key={i}>
          <h2>Section {i + 1}</h2>
          <p>Filler content so the page scrolls. The lead key follows your scroll position from top (C3) to bottom.</p>
        </section>
      ))}
    </main>
  );
}

export default PianoRailExample;
