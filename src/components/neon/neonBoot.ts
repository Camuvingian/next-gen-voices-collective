/**
 * Applies the visitor's saved neon settings to <html> before the first paint.
 *
 * Self-contained on purpose (no outside references): it is serialised with
 * toString() into an inline <head> script (see NeonBootScript), and the neon
 * menu calls it too when the colour or power changes, so both always agree.
 *
 *  - power   → data-neon="on|off"
 *  - colour  → data-ng-hl="ruby|white|…" for presets, or the --hl* and brand
 *              tokens set inline for a custom "#rrggbb"
 *  - lettering other than the default → data-neon-pending, which hides the
 *    signs until React has drawn them in the saved lettering
 *  - Piano Scroll on → data-ngp-open, so the page is already offset for the
 *    piano rail on first paint (boot only; the rail manages it afterwards)
 */
export function applyNeonSettings(settings?: { on?: boolean; colour?: string; font?: string; piano?: boolean } | null, pendingFont?: boolean) {
  const root = document.documentElement;
  let s = settings;
  if (s === undefined) {
    try {
      s = JSON.parse(localStorage.getItem("ng-neon") || "null");
    } catch {
      s = null; // storage blocked or corrupt: defaults
    }
  }
  s = s || {};

  root.dataset.neon = s.on === false ? "off" : "on";

  const vars = ["--hl", "--hl-rgb", "--hl-ink", "--hl-fg", "--hl-text", "--hl-2", "--ng-glow", "--ng-glow-2", "--ng-edge", "--ng-secondary", "--ng-shine", "--ng-logo-accent"];
  vars.forEach((v) => root.style.removeProperty(v));
  const colour = typeof s.colour === "string" ? s.colour : "red";
  const presets = ["ruby", "white", "blue", "pink", "violet"];

  if (/^#[0-9a-f]{6}$/i.test(colour)) {
    delete root.dataset.ngHl;
    // a custom colour gets the same token set as the presets in tokens.css
    const rgb = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
    const hex = (c: number[]) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const toWhite = (a: number) => rgb.map((c) => c + (255 - c) * a);
    const scale = (k: number) => rgb.map((c) => c * k);
    const [r, g, b] = rgb.map((c) => c / 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const tokens: Record<string, string> = {
      "--hl": colour,
      "--hl-rgb": rgb.join(", "),
      "--hl-ink": hex(scale(0.55)),
      "--hl-fg": luminance > 0.5 ? "#0b0b0b" : "#ffffff",
      "--hl-text": luminance < 0.35 ? hex(toWhite(0.25)) : colour,
      "--hl-2": hex(toWhite(0.45)),
      "--ng-glow": scale(0.87).map(Math.round).join(", "),
      "--ng-glow-2": scale(0.5).map(Math.round).join(", "),
      "--ng-edge": hex(scale(0.64)),
      "--ng-secondary": hex(scale(0.35)),
      "--ng-shine": hex(toWhite(0.8)),
      "--ng-logo-accent": hex(toWhite(0.05)),
    };
    Object.keys(tokens).forEach((k) => root.style.setProperty(k, tokens[k]));
  } else if (presets.indexOf(colour) >= 0) root.dataset.ngHl = colour;
  else delete root.dataset.ngHl;

  if (pendingFont !== false && s.font && s.font !== "script") root.dataset.neonPending = "";
  if (pendingFont !== false && s.piano === true) root.dataset.ngpOpen = "";
}
