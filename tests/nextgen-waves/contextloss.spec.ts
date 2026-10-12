import { expect, test } from "@playwright/test";
import { hero, openPreview } from "./helpers";

test("a lost WebGL context swaps to Canvas 2D without a blank frame", async ({ page }) => {
  await openPreview(page);
  expect(await hero(page).mode()).toBe("webgl");
  await page.evaluate(() => {
    const c = document.querySelector(".hero canvas") as HTMLCanvasElement;
    c.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await page.waitForFunction(() => window.__ngWaves?.hero?.mode === "2d");
  await expect(page.locator(".hero .ng-waves")).toHaveAttribute("data-mode", "2d");
  await page.waitForTimeout(300);
  expect((await hero(page).frame()).time).toBeGreaterThan(0.2);
});
