import { expect, test, type Page } from "@playwright/test";
import { evidence, hero, openPreview } from "./helpers";

/**
 * Dispatch a touch sequence the way a phone delivers it while the page
 * scrolls: touchstart, then touchmoves whose finger x drifts sideways while
 * the page scrolls underneath. Returns whether any listener called
 * preventDefault (it must not).
 */
async function syntheticTouch(page: Page, type: "touchstart" | "touchmove" | "touchend", x: number, y: number) {
  return page.evaluate(
    ([type, x, y]) => {
      const d = document as Document & {
        createTouch?: (...a: unknown[]) => Touch;
        createTouchList?: (...t: Touch[]) => TouchList;
      };
      let ev: Event;
      let how: string;
      try {
        // Chromium: real Touch / TouchEvent constructors
        const t = new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y, pageX: x, pageY: y + scrollY });
        ev = new TouchEvent(type, { touches: type === "touchend" ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true });
        how = "TouchEvent";
      } catch {
        // WebKit: Touch has no constructor; a cancelable Event of the same type carrying a touch list
        const t = d.createTouch
          ? d.createTouch(window, document.body, 1, x, y + scrollY, x, y)
          : ({ identifier: 1, target: document.body, clientX: x, clientY: y, pageX: x, pageY: y + scrollY } as unknown as Touch);
        ev = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, "touches", { value: type === "touchend" ? [] : [t] });
        Object.defineProperty(ev, "changedTouches", { value: [t] });
        how = d.createTouch ? "Event+createTouch" : "Event+touch-like";
      }
      document.body.dispatchEvent(ev);
      (window as unknown as { __touchHow: string }).__touchHow = how;
      return ev.defaultPrevented;
    },
    [type, x, y] as const,
  );
}

test.describe("mobile", () => {
  test("tap plucks under the finger (and moves the swell there)", async ({ page }, info) => {
    await openPreview(page);
    const h = hero(page);
    const vw = page.viewportSize()!.width;
    const vh = page.viewportSize()!.height;
    for (const fx of [0.25, 0.7]) {
      await page.touchscreen.tap(fx * vw, vh * 0.4);
      const slot = ((await h.head()) + 2) % 3;
      await page.waitForFunction((s) => window.__ngWaves!.hero.input.frame.pl[s * 3 + 2] > 0, slot);
      const f = await h.frame();
      expect(f.pl[slot * 3 + 2]).toBeCloseTo(1.1, 5); // touch amplitude
      const px = await h.pluckX(slot);
      console.log(`${info.project.name}: tap at ${fx} → ripple at ${px.toFixed(4)} (Δ ${(Math.abs(px - fx) * 100).toFixed(2)}%)`);
      expect(Math.abs(px - fx)).toBeLessThan(0.05);
      await page.waitForTimeout(500);
      expect(Math.abs((await h.swellX()) - fx)).toBeLessThan(0.05);
    }
    await page.waitForTimeout(100);
    await page.screenshot({ path: evidence(info, "tap-ripple") });
  });

  test("touch drag while the page scrolls keeps the swell under the finger", async ({ page }, info) => {
    await openPreview(page);
    const h = hero(page);
    const vw = page.viewportSize()!.width;
    const y = page.viewportSize()!.height * 0.55;
    const rows: string[] = [];

    expect(await syntheticTouch(page, "touchstart", vw * 0.15, y)).toBe(false);
    for (let i = 1; i <= 24; i++) {
      const fx = 0.15 + (0.7 * i) / 24;
      await page.evaluate(() => window.scrollBy(0, 6)); // the page scrolls under the finger
      expect(await syntheticTouch(page, "touchmove", fx * vw, y)).toBe(false);
      await page.waitForTimeout(32);
      if (i % 6 === 0) {
        await page.waitForTimeout(250); // let the 0.25/frame ease catch up
        const sx = await h.swellX();
        rows.push(
          `finger ${fx.toFixed(3)}  scrollY ${await page.evaluate(() => Math.round(scrollY))}  swell ${sx.toFixed(4)}  Δ ${(Math.abs(sx - fx) * 100).toFixed(2)}%`,
        );
        expect(Math.abs(sx - fx)).toBeLessThan(0.05);
      }
    }
    await page.screenshot({ path: evidence(info, "drag-while-scrolling") });
    expect(await syntheticTouch(page, "touchend", 0.85 * vw, y)).toBe(false);
    const scrolled = await page.evaluate(() => scrollY);
    expect(scrolled).toBeGreaterThan(100);
    // finger lifted: the swell stays put
    const before = await h.swellX();
    await page.waitForTimeout(600);
    expect(Math.abs((await h.swellX()) - before)).toBeLessThan(0.01);
    const how = await page.evaluate(() => (window as unknown as { __touchHow: string }).__touchHow);
    console.log(`\n${info.project.name} (${how})\n` + rows.join("\n"));
  });

  test("a real touch drag scrolls the page and the swell follows (Chromium input pipeline)", async ({ page, browserName }, info) => {
    test.skip(browserName !== "chromium", "CDP touch input is Chromium-only; WebKit is covered by the synthetic sequence above");
    await openPreview(page);
    const h = hero(page);
    const cdp = await page.context().newCDPSession(page);
    const vw = page.viewportSize()!.width;
    const y0 = page.viewportSize()!.height * 0.75;
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });

    await touch("touchStart", vw * 0.2, y0);
    const samples: string[] = [];
    let worst = 0;
    for (let i = 1; i <= 30; i++) {
      const fx = 0.2 + (0.6 * i) / 30;
      await touch("touchMove", fx * vw, y0 - i * 12); // diagonal: scrolls the page while moving sideways
      await page.waitForTimeout(24);
      if (i % 10 === 0) {
        await page.waitForTimeout(250);
        const sx = await h.swellX();
        worst = Math.max(worst, Math.abs(sx - fx));
        samples.push(`finger ${fx.toFixed(3)}  scrollY ${await page.evaluate(() => Math.round(scrollY))}  swell ${sx.toFixed(4)}`);
      }
    }
    await touch("touchEnd", 0, 0);
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log(`\n${info.project.name} (CDP)\n` + samples.join("\n"));
    expect(scrollY).toBeGreaterThan(150); // the page really scrolled: nothing called preventDefault
    expect(worst).toBeLessThan(0.05);
  });
});
