import { expect, test } from "@playwright/test";
import { argmax, columnProfile, evidence, hero, openPreview, smooth, wavesOnly } from "./helpers";

test.use({ launchOptions: { args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] } });

test.describe("Canvas 2D fallback: WebGL disabled in the browser", () => {
  test("detects no WebGL, renders in 2D and reacts the same way", async ({ page }, info) => {
    await openPreview(page);
    await wavesOnly(page);
    const h = hero(page);
    expect(await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"))).toBe(false);
    expect(await h.mode()).toBe("2d");
    await page.screenshot({ path: evidence(info, "fallback-2d") });

    const prof = await columnProfile(page, await page.screenshot());
    expect(prof.sum.reduce((a, b) => a + b, 0)).toBeGreaterThan(1e5); // lines are drawn

    // swell under the pointer: live projection + pixels (same method as the WebGL test)
    const rows: string[] = [];
    for (const x of [0.2, 0.5, 0.8]) {
      await page.mouse.move(x * 1440, 450, { steps: 10 });
      await page.waitForTimeout(1200);
      const sx = await h.swellX();
      const total = new Array(1440).fill(0);
      for (const t of [0, 1, 2, 3, 4, 5, 6, 7].map((k) => 2 + k * 1.43)) {
        const set = (strength: number) =>
          page.evaluate(
            ([t, strength]) => {
              const i = window.__ngWaves!.hero.input;
              i.freezeTime(t);
              Object.assign(i.overrides, { strength, swellW: 0.08 });
            },
            [t, strength] as const,
          );
        await set(0);
        await page.waitForTimeout(80);
        const A = await columnProfile(page, await page.screenshot());
        await set(2.5);
        await page.waitForTimeout(80);
        const B = await columnProfile(page, await page.screenshot());
        B.spread.forEach((sb, k) => (total[k] += sb * sb - A.spread[k] * A.spread[k]));
      }
      await page.evaluate(() => {
        const i = window.__ngWaves!.hero.input;
        Object.assign(i.overrides, { strength: null, swellW: null });
        i.freezeTime(null);
      });
      const peak = argmax(smooth(total, 6)) / 1440;
      rows.push(`pointer ${x} → projected ${sx.toFixed(4)}, pixels ${peak.toFixed(4)}`);
      expect(Math.abs(sx - x)).toBeLessThan(0.05);
      expect(Math.abs(peak - x)).toBeLessThan(0.05);
    }
    console.log("\n" + rows.join("\n"));

    // pluck lands under the click
    await page.mouse.move(0.4 * 1440, 450);
    await page.mouse.down();
    await page.mouse.up();
    const slot = ((await h.head()) + 2) % 3; // the slot just written
    await page.waitForFunction((s) => window.__ngWaves!.hero.input.frame.pl[s * 3 + 2] > 0, slot);
    expect(Math.abs((await h.pluckX(slot)) - 0.4)).toBeLessThan(0.05);
    await page.waitForTimeout(200);
    await page.screenshot({ path: evidence(info, "fallback-2d-pluck") });
  });
});
