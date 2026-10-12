import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EVIDENCE, openPreview } from "./helpers";

/**
 * 10 s on a Pixel 7 viewport (412×915, DPR 2.625 → capped at 2), CPU throttled
 * 4×, real GPU. A finger drags across the hero and taps during the run.
 * Measures frame intervals, long tasks, and the CPU our frame costs
 * (input tick + three.js render call), plus the rAF callback time from a
 * Chrome trace.
 */
for (const mode of ["webgl", "2d"] as const) {
  test(`performance: ${mode}, 4× CPU throttle, 10 s`, async ({ page, browser }, info) => {
    test.setTimeout(90_000);
    await openPreview(page, mode === "2d" ? "nopanel&fallback=1" : "nopanel");
    expect(await page.evaluate(() => window.__ngWaves!.hero.mode)).toBe(mode);
    const gpu = await page.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const d = gl?.getExtension("WEBGL_debug_renderer_info");
      return gl && d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : "n/a";
    });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.waitForTimeout(1000); // settle under throttle

    // in-page probes: frame intervals, long tasks, and the CPU our frame costs
    await page.evaluate(() => {
      const w = window as unknown as { __perf: { frames: number[]; ours: number[]; longTasks: number[] } };
      const perf = (w.__perf = { frames: [] as number[], ours: [] as number[], longTasks: [] as number[] });
      const e = window.__ngWaves!.hero as unknown as {
        input: { tick: (dt: number) => unknown };
        gl?: { render: (...a: unknown[]) => void };
        canvas: HTMLCanvasElement;
      };
      let acc = 0;
      const tick = e.input.tick.bind(e.input);
      e.input.tick = (dt: number) => {
        const t0 = performance.now();
        const r = tick(dt);
        acc += performance.now() - t0;
        return r;
      };
      if (e.gl) {
        const render = e.gl.render.bind(e.gl);
        e.gl.render = (...a: unknown[]) => {
          const t0 = performance.now();
          render(...a);
          acc += performance.now() - t0;
          perf.ours.push(acc);
          acc = 0;
        };
      }
      let last = performance.now();
      const loop = (now: number) => {
        perf.frames.push(now - last);
        last = now;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      new PerformanceObserver((l) => l.getEntries().forEach((x) => perf.longTasks.push(x.duration))).observe({ type: "longtask" });
    });

    const tracePath = resolve(EVIDENCE, `trace-${mode}.json`);
    await browser.startTracing(page, { path: tracePath, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });

    // 10 s: drag a finger back and forth across the hero, tap now and then
    const vw = page.viewportSize()!.width;
    const y = page.viewportSize()!.height * 0.5;
    const t0 = Date.now();
    let i = 0;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: vw * 0.1, y, id: 1 }] });
    while (Date.now() - t0 < 10_000) {
      const x = vw * (0.5 + 0.4 * Math.sin(i / 12));
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y, id: 1 }] });
      if (i % 60 === 59) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.touchscreen.tap(x, y);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
      }
      i++;
      await page.waitForTimeout(32);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await browser.stopTracing();
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

    const raw = await page.evaluate(
      () => (window as unknown as { __perf: { frames: number[]; ours: number[]; longTasks: number[] } }).__perf,
    );
    const frames = raw.frames.slice(5);
    const ours = raw.ours.slice(5);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const pct = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * p)] ?? 0;

    // trace: rAF callbacks on the renderer main thread and tasks over 50 ms
    const trace = JSON.parse(readFileSync(tracePath, "utf8"));
    const events: { name: string; ph: string; dur?: number }[] = trace.traceEvents ?? trace;
    const raf = events.filter((e) => e.name === "FireAnimationFrame" && e.dur).map((e) => e.dur! / 1000);
    const longTraceTasks = events.filter((e) => e.name === "RunTask" && (e.dur ?? 0) > 50_000).map((e) => e.dur! / 1000);

    const r = {
      mode,
      gpu,
      viewport: `${vw}×${page.viewportSize()!.height} @ dpr ${await page.evaluate(() => devicePixelRatio)} (canvas capped at 2)`,
      frames: frames.length,
      avgFrameMs: +avg(frames).toFixed(2),
      fps: +(1000 / avg(frames)).toFixed(1),
      p95FrameMs: +pct(frames, 0.95).toFixed(2),
      framesOver20ms: frames.filter((f) => f > 20).length,
      // WebGL: input tick + three.js render call. 2D: tick and draw share one rAF, so use the trace's rAF time instead.
      ourCpuPerFrameMs: ours.length
        ? { avg: +avg(ours).toFixed(3), p95: +pct(ours, 0.95).toFixed(3), max: +Math.max(...ours).toFixed(3) }
        : "see rafCallbackMs_trace",
      rafCallbackMs_trace: { count: raf.length, avg: +avg(raf).toFixed(3), p95: +pct(raf, 0.95).toFixed(3) },
      longTasks: {
        observed: raw.longTasks.length,
        totalMs: +raw.longTasks.reduce((a, b) => a + b, 0).toFixed(1),
        traceOver50ms: longTraceTasks.length,
      },
    };
    console.log(JSON.stringify(r, null, 1));
    await info.attach(`perf-${mode}`, { body: JSON.stringify(r, null, 2), contentType: "application/json" });

    if (mode === "webgl") {
      expect(r.avgFrameMs).toBeLessThan(17.5); // 60 fps
      expect(avg(ours)).toBeLessThan(2); // < 2 ms CPU per frame, throttled
    }
  });
}
