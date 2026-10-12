import { expect, test } from "@playwright/test";
import { argmax, columnDiff, columnProfile, evidence, hero, openPreview, smooth, wavesOnly } from "./helpers";

const XS = [0.12, 0.3, 0.5, 0.7, 0.88];

test.describe("desktop 1440×900", () => {
  test("hover: the swell peak sits under the pointer (live camera + pixels)", async ({ page }, info) => {
    await openPreview(page);
    await wavesOnly(page);
    const h = hero(page);
    await page.evaluate(() => window.__ngWaves!.hero.input.freezeTime(2));
    const W = 1440,
      H = 900;
    const rows: string[] = [];

    for (const x of XS) {
      await page.mouse.move(x * W, H * 0.5, { steps: 12 });
      await page.waitForTimeout(1500); // swell + parallax settle

      // 1) through the live three.js camera and group matrices
      const sx = await h.swellX();
      expect(Math.abs(sx - x), `projected swell at ${x}`).toBeLessThan(0.05);

      // 2) in the pixels: same pointer, same tilt, swell off vs on. The real swell is
      //    broad (0.42 of the screen at 1/e), so its top is a plateau; narrow it to
      //    0.08·span so the shader's placement shows as a sharp peak. The swell scales
      //    the wave height, so where a line crosses zero nothing changes: average the
      //    difference over eight frozen times (one period of the slowest voice) to move those crossings around.
      const total = new Array(W).fill(0);
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
        await page.waitForTimeout(100);
        const off = await page.screenshot();
        await set(2.5);
        await page.waitForTimeout(100);
        const on = await page.screenshot();
        if (x === 0.3 && t === 2) await page.screenshot({ path: evidence(info, "hover-x030") });
        // brightness-weighted vertical variance grows with (swell² − 1) × wave variance and,
        // unlike a raw pixel diff, does not saturate once lines move more than their width
        const A = await columnProfile(page, off),
          B = await columnProfile(page, on);
        B.spread.forEach((sb, k) => (total[k] += sb * sb - A.spread[k] * A.spread[k]));
      }
      await page.evaluate(() => {
        const i = window.__ngWaves!.hero.input;
        Object.assign(i.overrides, { strength: null, swellW: null });
        i.freezeTime(2);
      });
      const peak = argmax(smooth(total, 6)) / W;
      rows.push(
        `pointer ${x.toFixed(2)} → camera ${sx.toFixed(4)} (Δ ${(Math.abs(sx - x) * 100).toFixed(2)}%), pixels ${peak.toFixed(4)} (Δ ${(Math.abs(peak - x) * 100).toFixed(2)}%)`,
      );
      expect.soft(Math.abs(peak - x), `pixel swell peak at ${x}`).toBeLessThan(0.05);
    }
    console.log("\n" + rows.join("\n"));
    await info.attach("swell-positions", {
      body: rows.join("\n"),
      contentType: "text/plain",
    });
  });

  test("click: a ripple spreads from the click point (0 / 150 / 600 ms)", async ({ page }, info) => {
    await openPreview(page);
    await wavesOnly(page);
    const h = hero(page);
    const X = 0.62 * 1440,
      Y = 0.5 * 900;
    await page.mouse.move(X, Y, { steps: 8 });
    await page.waitForTimeout(1500);
    // freeze the waves (ripples keep ageing) and pin the swell so only the ripple changes the picture
    await page.evaluate(() => {
      const i = window.__ngWaves!.hero.input;
      i.freezeTime(2);
      i.overrides.strength = 0.9; // a pluck adds energy, which would also swell and tighten the field
      i.overrides.swellW = 0.42;
    });
    await page.waitForTimeout(150);
    const base = await page.screenshot();

    await page.mouse.down();
    await page.mouse.up();
    const slot = (await h.head()) === 0 ? 2 : (await h.head()) - 1;
    await page.waitForFunction((s) => window.__ngWaves!.hero.input.frame.pl[s * 3 + 2] > 0, slot); // next frame
    expect(Math.abs((await h.pluckX(slot)) - 0.62)).toBeLessThan(0.05);

    const rows: string[] = [];
    const widths: number[] = [];
    for (const target of [0, 0.15, 0.6]) {
      await page.waitForFunction(([s, t]) => window.__ngWaves!.hero.input.frame.pl[s * 3 + 1] >= t, [slot, target] as const);
      const shot = await page.screenshot({
        path: evidence(info, `pluck-${Math.round(target * 1000)}ms`),
      });
      const age = (await h.frame()).pl[slot * 3 + 1];
      const diff = smooth(await columnDiff(page, base, shot), 4);
      const max = Math.max(...diff);
      const lit = diff.map((d, i) => (d > max * 0.15 ? i : -1)).filter((i) => i >= 0);
      const left = lit[0] / 1440,
        right = lit[lit.length - 1] / 1440,
        centre = argmax(diff) / 1440;
      widths.push(right - left);
      rows.push(
        `t≈${(age * 1000).toFixed(0)} ms: changed x ${left.toFixed(3)}–${right.toFixed(3)} (width ${(right - left).toFixed(3)}), strongest ${centre.toFixed(3)}`,
      );
    }
    console.log("\n" + rows.join("\n"));
    await info.attach("ripple", {
      body: rows.join("\n"),
      contentType: "text/plain",
    });
    expect(widths[2]).toBeGreaterThan(widths[1]);
  });

  test("buttons above the waves stay clickable (and still pluck)", async ({ page }) => {
    await openPreview(page, "");
    const h = hero(page);
    const before = await h.head();
    await page.getByTestId("cta").click();
    await expect(page.getByTestId("log")).toContainText("button clicked");
    await expect(page.getByTestId("log")).toContainText("pluck @");
    expect(await h.head()).not.toBe(before);
  });

  test("colour switch applies within a frame, without restarting", async ({ page }) => {
    await openPreview(page);
    const t0 = (await hero(page).frame()).time;
    await page.evaluate(() => document.documentElement.style.setProperty("--ng-glow", "79, 195, 255"));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const accent = await page.evaluate(() => {
      const m = (
        window.__ngWaves!.hero as unknown as {
          material: () => {
            uniforms: Record<string, { value: { x: number } }>;
          };
        }
      ).material();
      return m.uniforms.uAccent.value.x;
    });
    expect(accent).toBeCloseTo(79 / 255, 3);
    expect((await hero(page).frame()).time).toBeGreaterThan(t0); // clock kept running
  });
});
