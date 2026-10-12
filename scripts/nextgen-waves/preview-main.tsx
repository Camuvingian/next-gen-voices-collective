/**
 * preview.html entry: a Noir hero + scrolling content + footer CTA, with a
 * small control panel. Doubles as the Playwright harness: query params
 * (?fallback=1, ?density=, ?bloom=1, …) and window.__ngPreview for remounts.
 */
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { NextGenWaves, type NextGenWavesHandle } from "../../src/components/nextgen-waves/NextGenWaves";

const q = new URLSearchParams(location.search);
const flag = (k: string, d: boolean) => (q.has(k) ? q.get(k) !== "0" : d);
const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);

const THEMES: Record<string, [string, string] | null> = {
  "Site red": null,
  Ruby: ["255, 58, 80", "138, 11, 28"],
  Bone: ["244, 241, 234", "120, 116, 108"],
  "Neon blue": ["79, 195, 255", "20, 95, 138"],
};

type Opts = {
  density: number;
  intensity: number;
  plucks: boolean;
  bloom: boolean;
  pinch: boolean;
  idleBreath: boolean;
  chordChanges: boolean;
  scrollCoupling: boolean;
  forceFallback: boolean;
};

function App() {
  const [opts, setOpts] = useState<Opts>({
    density: num("density", 16),
    intensity: num("intensity", 1),
    plucks: flag("plucks", true),
    bloom: flag("bloom", false),
    pinch: flag("pinch", false),
    idleBreath: flag("idle", false),
    chordChanges: flag("chord", false),
    scrollCoupling: flag("scroll", true),
    forceFallback: flag("fallback", false),
  });
  const [theme, setTheme] = useState("Site red");
  const [mounted, setMounted] = useState(true);
  const [panel, setPanel] = useState(!q.has("nopanel"));
  const [log, setLog] = useState<string[]>([]);
  const hero = useRef<NextGenWavesHandle>(null);

  useEffect(() => {
    (window as unknown as { __ngPreview: unknown }).__ngPreview = {
      setMounted,
      pluck: (x: number, amp?: number) => hero.current?.pluck(x, amp),
    };
  }, []);

  const applyTheme = (name: string) => {
    setTheme(name);
    const t = THEMES[name];
    const html = document.documentElement;
    if (t) {
      html.style.setProperty("--ng-glow", t[0]);
      html.style.setProperty("--ng-glow-2", t[1]);
    } else {
      html.style.removeProperty("--ng-glow");
      html.style.removeProperty("--ng-glow-2");
    }
  };

  const toggle = (k: keyof Opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  return (
    <>
      <section className="hero" data-testid="hero">
        {mounted && (
          <NextGenWaves
            ref={hero}
            debugId="hero"
            {...opts}
            onPluck={(x) => setLog((l) => [`pluck @ ${x.toFixed(3)}`, ...l].slice(0, 4))}
          />
        )}
        <div className="vignette" />
        <div className="hero-copy">
          <p className="eyebrow">NextGen Voice Collective · London</p>
          <h1>
            Young voices.
            <br />
            <em>One sound.</em>
          </h1>
          <p className="lede">An audition-based vocal ensemble for singers aged 13–18. Move across the waves; click or tap to pluck them.</p>
          <div className="row">
            <button className="btn" data-testid="cta" onClick={() => setLog((l) => ["button clicked", ...l].slice(0, 4))}>
              Apply to audition
            </button>
            <button className="btn ghost" onClick={() => hero.current?.pluck(Math.random())}>
              Pluck from code
            </button>
          </div>
          <p className="log" data-testid="log">{log.join(" · ")}</p>
        </div>
      </section>

      <main className="content">
        {["Rehearsals", "Repertoire", "Performances", "Auditions"].map((h) => (
          <article key={h}>
            <h2>{h}</h2>
            <p>
              Weekly rehearsals in central London, a repertoire that runs from jazz standards to new commissions, and a season of
              performances on real stages. Scroll the page with a finger on the hero to check the swell follows you.
            </p>
          </article>
        ))}
      </main>

      <footer className="footer" data-testid="footer">
        <NextGenWaves debugId="footer" density={10} intensity={0.8} forceFallback={opts.forceFallback} />
        <div className="footer-copy">
          <h2>Think you&rsquo;ve got the voice and the work ethic?</h2>
          <button className="btn">Start your application</button>
        </div>
      </footer>

      {panel && (
        <aside className="panel">
          <button className="close" onClick={() => setPanel(false)} aria-label="Hide controls">×</button>
          <strong>Waves</strong>
          <label>
            density {opts.density}
            <input type="range" min={4} max={24} value={opts.density} onChange={(e) => setOpts({ ...opts, density: +e.target.value })} />
          </label>
          <label>
            intensity {opts.intensity.toFixed(2)}
            <input type="range" min={0.2} max={2} step={0.05} value={opts.intensity} onChange={(e) => setOpts({ ...opts, intensity: +e.target.value })} />
          </label>
          {(["plucks", "scrollCoupling", "bloom", "pinch", "idleBreath", "chordChanges", "forceFallback"] as const).map((k) => (
            <label key={k} className="check">
              <input type="checkbox" checked={opts[k]} onChange={() => toggle(k)} /> {k}
            </label>
          ))}
          <label>
            colour
            <select value={theme} onChange={(e) => applyTheme(e.target.value)}>
              {Object.keys(THEMES).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <button className="btn small" onClick={() => setMounted((m) => !m)}>{mounted ? "Unmount" : "Mount"} hero</button>
        </aside>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
