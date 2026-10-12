import { useEffect, useState } from "react";

/**
 * PaletteDock: a design-review tool (bottom-right). Pick the neon colour used
 * for emphasised words, buttons and accents, and replay the intro animations.
 * Applies live by setting data-ng-hl on <html>. Remove before launch, or keep
 * it behind ?review=1.
 */

export type Neon = { key: string; name: string; hex: string; ref: string; use: string; swatch: string };

export const NEONS: Neon[] = [
  { key: "neon-red", name: "Neon red", hex: "#FF2E3F", ref: "Classic red neon tube", use: "The supper-club sign over the door", swatch: "linear-gradient(160deg, #ff8a93, #ff2e3f 45%, #a3121f)" },
  { key: "ruby", name: "Ruby", hex: "#D1112B", ref: "Deep red, matches the logo", use: "Velvet rope, lipstick, the logo", swatch: "linear-gradient(160deg, #ff5a66, #d1112b 45%, #6d0712)" },
  { key: "white", name: "White neon", hex: "#F4F1EA", ref: "Pure black-and-white noir", use: "Marquee lights, no colour at all", swatch: "linear-gradient(160deg, #ffffff, #e9e6df 45%, #9c9993)" },
  { key: "blue", name: "Blue note", hex: "#4FC3FF", ref: "Cold blue neon", use: "Late-set lighting", swatch: "linear-gradient(160deg, #c2ecff, #4fc3ff 45%, #145f8a)" },
  { key: "pink", name: "Neon pink", hex: "#FF5FA2", ref: "Hot pink neon", use: "Cocktail-bar signs", swatch: "linear-gradient(160deg, #ffc2dc, #ff5fa2 45%, #a3174f)" },
  { key: "violet", name: "Violet", hex: "#B26BFF", ref: "Argon-mercury violet", use: "Backstage glow", swatch: "linear-gradient(160deg, #e3ccff, #b26bff 45%, #5a2bc4)" },
];

const DEFAULT = "neon-red";

export function applyNeon(key: string) {
  if (key === DEFAULT) delete document.documentElement.dataset.ngHl;
  else document.documentElement.dataset.ngHl = key;
  try {
    localStorage.setItem("ng-hl", key);
  } catch {
    /* storage blocked */
  }
}

export function PaletteDock() {
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState<string>(() => document.documentElement.dataset.ngHl || DEFAULT);
  const current = NEONS.find((n) => n.key === hl) ?? NEONS[0];

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const pick = (k: string) => {
    setHl(k);
    applyNeon(k);
  };

  return (
    <div className={["ng-dock", open && "is-open"].filter(Boolean).join(" ")}>
      <div className="ng-dock-panel" id="ng-dock-panel" role="dialog" aria-label="Neon colour" hidden={!open}>
        <div className="ng-dock-head">
          <p className="ng-eyebrow">Neon colour</p>
          <button className="ng-dock-x" onClick={() => setOpen(false)} aria-label="Close palette">
            ×
          </button>
        </div>
        <div className="ng-dock-list" role="radiogroup" aria-label="Neon colours">
          {NEONS.map((n) => (
            <button key={n.key} role="radio" aria-checked={hl === n.key} className={["ng-dock-item", hl === n.key && "is-on"].filter(Boolean).join(" ")} onClick={() => pick(n.key)}>
              <span className="ng-dock-chip" style={{ background: n.swatch }} aria-hidden="true">
                <i />
              </span>
              <span className="ng-dock-text">
                <strong>{n.name}</strong>
                <small>{n.use}</small>
                <small className="ng-dock-ref">{n.ref}</small>
              </span>
              <code>{n.hex}</code>
            </button>
          ))}
        </div>
        <p className="ng-dock-note">The logo and the sound waves stay deep red whichever neon you choose.</p>
      </div>
      <div className="ng-dock-bar">
        <div className="ng-dock-strip" role="radiogroup" aria-label="Quick neon colour">
          {NEONS.map((n) => (
            <button
              key={n.key}
              role="radio"
              aria-checked={hl === n.key}
              aria-label={n.name}
              title={`${n.name} ${n.hex}`}
              className={["ng-dock-dot", hl === n.key && "is-on"].filter(Boolean).join(" ")}
              style={{ background: n.swatch }}
              onClick={() => pick(n.key)}
            >
              <i />
            </button>
          ))}
        </div>
        <div className="ng-dock-row">
          <button
            type="button"
            className="ng-dock-reload"
            onClick={() => window.dispatchEvent(new Event("ng:reload"))}
            aria-label="Reload page and replay animations"
            title="Reload page"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11a8 8 0 1 0-2.3 5.7" />
              <path d="M20 4v7h-7" />
            </svg>
            <span>Reload</span>
          </button>
          <button className="ng-dock-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="ng-dock-panel">
            <span className="ng-dock-name">{current.name}</span>
            <span aria-hidden="true">{open ? "▾" : "▴"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
