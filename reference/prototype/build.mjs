// Prototype build: esbuild → one self-contained HTML (artifact) + full doc (local preview).
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const r = await esbuild.build({
  entryPoints: ["src/main.tsx"], bundle: true, minify: true, write: false, format: "iife",
  target: "es2020", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "warning",
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = ["src/theme/tokens.css", "src/theme/styles.css", "src/theme/noir.css", "src/components/NextGenLogo.css", "src/assets/piano-rail/NextGenPianoRail.css"].filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
const cssMin = (await esbuild.transform(css, { loader: "css", minify: true })).code;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Limelight&family=Yellowtail&family=Jost:wght@300;400;500;600&family=Josefin+Sans:wght@400;600;700&display=swap">`;
const THREE = `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`;
const body = `<div id="root"></div>\n${THREE}\n<script>${js}</script>`;
const head = `<title>NextGen Voice Collective</title>\n<meta name="description" content="NextGen Voice Collective: an elite, audition-based vocal ensemble for singers aged 13–18.">\n${FONTS}\n<style>${cssMin}</style>`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/artifact.html", `${head}\n${body}\n`);
writeFileSync("dist/index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${head}</head><body>${body}</body></html>`);
console.log("js", (js.length / 1024).toFixed(0) + "KB", "css", (cssMin.length / 1024).toFixed(0) + "KB");
