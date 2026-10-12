import { type Page, type TestInfo } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const PREVIEW = "file://" + resolve(__dirname, "../../src/components/nextgen-waves/preview.html");
export const EVIDENCE = resolve(__dirname, "../../test-results/nextgen-waves-evidence");
mkdirSync(EVIDENCE, { recursive: true });

export const evidence = (info: TestInfo, name: string) => resolve(EVIDENCE, `${info.project.name}-${name}.png`);

type Entry = {
  mode: "webgl" | "2d";
  swellScreenX: () => number;
  pluckScreenX: (slot: number) => number;
  input: {
    frame: {
      time: number;
      mouseT: number;
      energy: number;
      pl: Float32Array;
      strength: number;
    };
    state: { span: number; head: number; energy: number };
    overrides: { strength: number | null; swellW: number | null };
    freezeTime: (t: number | null) => void;
  };
};
declare global {
  interface Window {
    __NG_WAVES_DEBUG__?: boolean;
    __ngWaves?: Record<string, Entry>;
    __ngPreview?: {
      setMounted: (m: boolean) => void;
      pluck: (x: number, amp?: number) => void;
    };
  }
}

/** Open the preview with the debug hook on and wait for the hero's first frames. */
export async function openPreview(page: Page, query = "nopanel") {
  await page.addInitScript(() => {
    window.__NG_WAVES_DEBUG__ = true;
  });
  await page.goto(`${PREVIEW}?${query}`);
  await page.waitForFunction(() => (window.__ngWaves?.hero?.input.frame.time ?? 0) > 0.2 || window.__ngWaves?.hero?.mode === "2d");
}

/** Hide the copy and vignette so pixel analysis sees only the waves. */
export async function wavesOnly(page: Page) {
  await page.addStyleTag({
    content: ".vignette, .hero-copy, .panel { visibility: hidden !important; }",
  });
}

export const hero = (page: Page) => ({
  swellX: () => page.evaluate(() => window.__ngWaves!.hero.swellScreenX()),
  pluckX: (slot: number) => page.evaluate((s) => window.__ngWaves!.hero.pluckScreenX(s), slot),
  frame: () =>
    page.evaluate(() => {
      const f = window.__ngWaves!.hero.input.frame;
      return {
        time: f.time,
        mouseT: f.mouseT,
        energy: f.energy,
        strength: f.strength,
        pl: Array.from(f.pl),
      };
    }),
  mode: () => page.evaluate(() => window.__ngWaves!.hero.mode),
  head: () => page.evaluate(() => window.__ngWaves!.hero.input.state.head),
});

/**
 * Per-column luminance profile of a screenshot (decoded in the page, so no
 * PNG dependency): for each column, total brightness and the brightness-
 * weighted vertical spread (std dev of y).
 */
export async function columnProfile(page: Page, png: Buffer) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    const sum = new Array(width).fill(0);
    const spread = new Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      let s = 0,
        sy = 0,
        syy = 0;
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        const l = Math.max(0, data[i] - 11); // background is #0b0b0b
        s += l;
        sy += l * y;
        syy += l * y * y;
      }
      sum[x] = s;
      const m = s > 0 ? sy / s : 0;
      spread[x] = s > 0 ? Math.sqrt(Math.max(0, syy / s - m * m)) : 0;
    }
    return { width, height, sum, spread };
  }, png.toString("base64"));
}

/** Absolute per-column difference in brightness between two screenshots. */
export async function columnDiff(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ([a64, b64]) => {
      const load = async (b: string) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height);
      };
      const A = await load(a64),
        B = await load(b64);
      const col = new Array(A.width).fill(0);
      for (let y = 0; y < A.height; y++)
        for (let x = 0; x < A.width; x++) {
          const i = (y * A.width + x) * 4;
          col[x] += Math.abs(A.data[i] - B.data[i]);
        }
      return col;
    },
    [a.toString("base64"), b.toString("base64")],
  );
}

export function smooth(xs: number[], r: number) {
  return xs.map((_, i) => {
    let s = 0,
      n = 0;
    for (let k = Math.max(0, i - r); k <= Math.min(xs.length - 1, i + r); k++) {
      s += xs[k];
      n++;
    }
    return s / n;
  });
}

export const argmax = (xs: number[]) => xs.reduce((best, v, i) => (v > xs[best] ? i : best), 0);
