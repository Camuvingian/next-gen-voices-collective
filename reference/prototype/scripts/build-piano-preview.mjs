// Builds src/assets/piano-rail/preview.html: a self-contained offline demo of the asset.
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
const entry = process.argv[2];
const r = await esbuild.build({ entryPoints: [entry], bundle: true, minify: true, write: false, format: "iife", target: "es2020", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' }, nodePaths: ["/home/claude/nextgen/node_modules"], logLevel: "warning" });
const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = readFileSync("src/assets/piano-rail/NextGenPianoRail.css", "utf8");
const demo = `body{margin:0;background:#0b0b0b;color:#f1efea;font:16px/1.6 "Jost","Futura",system-ui,sans-serif;transition:padding-left 600ms cubic-bezier(.76,0,.24,1)}
:root[data-ngp-open] body{padding-left:var(--ngp-rail-w)}
.ngp-demo{max-width:760px;margin:0 auto;padding:64px 24px 160px}
.ngp-demo h1{font:400 64px/1 "Limelight",Georgia,serif;margin:8px 0 16px}
.ngp-demo h2{font:400 28px/1.1 "Limelight",Georgia,serif;margin:0 0 8px}
.ngp-demo section{padding:56px 0;border-top:1px solid rgba(255,255,255,.12)}
.ngp-demo-eyebrow{letter-spacing:.22em;text-transform:uppercase;font-size:12px;color:#9c9993}
.ngp-demo header button{margin-top:16px;background:#ff2e3f;color:#fff;border:0;border-radius:999px;padding:12px 20px;font:600 13px "Josefin Sans",sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}`;
writeFileSync("src/assets/piano-rail/preview.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NextGen Piano Rail: preview</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Limelight&family=Jost:wght@400;500&family=Josefin+Sans:wght@600&display=swap"><style>${css}\n${demo}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
console.log("preview.html", Math.round(js.length / 1024) + "KB");
