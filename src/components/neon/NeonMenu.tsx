"use client";

import { useEffect, useRef, useState } from "react";
import { NEON_FONTS, useNeon } from "./NeonProvider";

/**
 * Neon menu: a small glass button top right that expands on hover (or tap on
 * touch screens). Switches every neon sign on the site off and on, and picks
 * the lettering the signs use.
 */
export function NeonMenu() {
  const { on, setOn, font, setFont } = useNeon();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // touch: tap outside or press Escape to close
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className={["ngn-menu", open && "is-open", on ? "is-on" : "is-off"].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="ngn-menu-btn"
        aria-expanded={open}
        aria-controls="ngn-menu-panel"
        aria-label="Neon sign settings"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12 3.2v7.6" />
          <path d="M7.1 6.4a7.6 7.6 0 1 0 9.8 0" />
        </svg>
      </button>

      <div id="ngn-menu-panel" className="ngn-menu-panel" role="group" aria-label="Neon signs">
        <div className="ngn-menu-row">
          <span className="ngn-menu-label">Neon signs</span>
          <button type="button" role="switch" aria-checked={on} className="ngn-switch" onClick={() => setOn(!on)}>
            <span className="ngn-switch-track" aria-hidden="true">
              <span className="ngn-switch-knob" />
            </span>
            <span className="ngn-switch-text">{on ? "On" : "Off"}</span>
          </button>
        </div>
        <div className="ngn-menu-row ngn-menu-row--stack">
          <span className="ngn-menu-label" id="ngn-font-label">
            Lettering
          </span>
          <div className="ngn-seg" role="radiogroup" aria-labelledby="ngn-font-label">
            {NEON_FONTS.map((f) => (
              <button key={f.value} type="button" role="radio" aria-checked={font === f.value} className="ngn-seg-btn" onClick={() => setFont(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
