import { expect, test } from "@playwright/test";
import { evidence, hero, PREVIEW } from "./helpers";

test.use({ reducedMotion: "reduce" });

// window listeners the waves would add when interactive
const OURS = ["pointermove", "pointerdown", "touchstart", "touchmove", "touchend", "touchcancel"];

test("prefers-reduced-motion: no interaction listeners, one still frame at time 2.0", async ({ page }, info) => {
  await page.addInitScript((ours) => {
    window.__NG_WAVES_DEBUG__ = true;
    const seen: string[] = [];
    (window as unknown as { __listeners: string[] }).__listeners = seen;
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, ...rest: unknown[]) {
      if ((this === window || this === document.documentElement) && ours.includes(type)) {
        // Playwright's own injected script adds hit-target interceptors; those are not ours
        const stack = new Error().stack ?? "";
        if (!stack.includes("InjectedScript")) seen.push(type + " @ " + stack.split("\n").slice(2, 4).join(" | ").slice(0, 240));
      }
      return (add as (...a: unknown[]) => void).call(this, type, ...rest);
    };
  }, OURS);
  await page.goto(`${PREVIEW}?nopanel`);
  await page.waitForFunction(() => window.__ngWaves?.hero);
  await page.waitForTimeout(800);

  const listeners = await page.evaluate(() => (window as unknown as { __listeners: string[] }).__listeners);
  console.log("interaction listeners attached:", JSON.stringify(listeners));
  expect(listeners).toEqual([]);

  const h = hero(page);
  expect((await h.frame()).time).toBe(2);

  // static: identical pixels a second apart, and pointer / click do nothing
  const a = await page.screenshot({ path: evidence(info, "reduced-motion") });
  await page.mouse.move(300, 450, { steps: 10 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(1000);
  const b = await page.screenshot();
  expect(Buffer.compare(a, b)).toBe(0);
  const f = await h.frame();
  expect(f.energy).toBe(0);
  expect(f.pl.every((v) => v === 0)).toBe(true);
  // and it actually drew something
  const lit = await page.evaluate(() => {
    const c = window.__ngWaves!.hero as unknown as {
      canvas: HTMLCanvasElement;
    };
    return c.canvas.width > 0;
  });
  expect(lit).toBe(true);
});
