// Builds src/components/nextgen-waves/preview.html: one self-contained file
// (React + three + the component, inlined), so it works opened from disk.
//   node scripts/nextgen-waves/build-preview.mjs
import * as esbuild from "esbuild";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../src/components/nextgen-waves/preview.html");

const r = await esbuild.build({
  entryPoints: [resolve(here, "preview-main.tsx")],
  bundle: true,
  minify: true,
  write: false,
  outdir: "out",
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
const js = r.outputFiles.find((f) => f.path.endsWith(".js")).text.replace(/<\/script/gi, "<\\/script");
const componentCss = r.outputFiles.find((f) => f.path.endsWith(".css"))?.text ?? "";

const pageCss = `
:root { --ng-glow: 222, 24, 44; --ng-glow-2: 128, 10, 24; --bg: #0b0b0b; --fg: #f4f1ea; --muted: #a39f97; --neon: #ff3a50;
  color-scheme: dark; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.55 "Jost", "Avenir Next", "Helvetica Neue", system-ui, sans-serif; }
.hero { position: relative; min-height: min(100svh, 980px); display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; isolation: isolate; padding: 120px 0 64px; }
.hero .ng-waves { z-index: -2; }
.vignette { position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(0,0,0,.75)), linear-gradient(transparent 55%, var(--bg)); }
.hero-copy, .footer-copy { width: min(1120px, 100% - 32px); margin: 0 auto; }
.eyebrow { letter-spacing: .18em; text-transform: uppercase; font-size: 12px; color: var(--muted); margin: 0 0 12px; }
h1 { font-family: "Limelight", "Didot", "Bodoni 72", Georgia, serif; font-weight: 400; font-size: clamp(3rem, 1.4rem + 7vw, 8.4rem); line-height: .98; margin: 0; }
h1 em { font-style: italic; color: var(--fg); }
.lede { max-width: 42ch; color: var(--muted); }
.row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
.btn { appearance: none; border: 1px solid var(--neon); background: var(--neon); color: #fff; padding: 14px 22px; font: 600 14px/1 inherit; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; border-radius: 2px; }
.btn.ghost { background: transparent; color: var(--fg); border-color: rgba(244,241,234,.35); }
.btn.small { padding: 8px 12px; font-size: 11px; }
.log { min-height: 1.5em; font: 12px/1.5 ui-monospace, Menlo, monospace; color: var(--muted); }
.content { width: min(1120px, 100% - 32px); margin: 0 auto; padding: 64px 0; display: grid; gap: 48px; }
.content h2, .footer h2 { font-family: "Limelight", "Didot", Georgia, serif; font-weight: 400; font-size: clamp(1.8rem, 1rem + 3vw, 3rem); margin: 0 0 8px; }
.content p { color: var(--muted); max-width: 60ch; min-height: 30vh; }
.footer { position: relative; overflow: hidden; isolation: isolate; padding: 160px 0; border-top: 1px solid rgba(244,241,234,.08); }
.footer .ng-waves { z-index: -1; }
.panel { position: fixed; right: 16px; bottom: 16px; z-index: 10; width: 220px; padding: 14px; display: grid; gap: 8px; font-size: 12px;
  background: rgba(16,16,16,.88); border: 1px solid rgba(244,241,234,.12); border-radius: 6px; backdrop-filter: blur(6px); }
.panel label { display: grid; gap: 4px; }
.panel label.check { display: flex; align-items: center; gap: 6px; }
.panel input[type=range], .panel select { width: 100%; }
.panel .close { position: absolute; top: 6px; right: 8px; background: none; border: 0; color: var(--muted); font-size: 18px; cursor: pointer; }
@media (max-width: 560px) { .panel { left: 16px; width: auto; grid-template-columns: 1fr 1fr; } .panel strong { grid-column: 1 / -1; } }
`;

const css = (await esbuild.transform(componentCss + pageCss, { loader: "css", minify: true })).code;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>NextGen Waves</title>
<meta name="description" content="NextGen Voice Collective reactive waves: offline preview.">
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;
writeFileSync(out, html);
console.log(`preview.html ${(html.length / 1024).toFixed(0)} KB → ${out}`);
