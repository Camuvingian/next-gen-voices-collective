import { expect, test } from "@playwright/test";
import { PREVIEW } from "./helpers";

test("20 mount/unmount cycles: no leaked WebGL contexts, listeners, canvases or heap", async ({ page }) => {
  test.setTimeout(120_000);
  const warnings: string[] = [];
  page.on("console", (m) => /WebGL|context|leak/i.test(m.text()) && warnings.push(m.text()));

  await page.addInitScript(() => {
    window.__NG_WAVES_DEBUG__ = true;
    const w = window as unknown as { __contexts: WeakRef<WebGLRenderingContext>[]; __live: Record<string, number> };
    // every WebGL context created (weakly held, so the probe itself cannot leak them)
    w.__contexts = [];
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (getContext as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
      if (ctx && /webgl/.test(type) && !w.__contexts.some((r) => r.deref() === ctx))
        w.__contexts.push(new WeakRef(ctx as WebGLRenderingContext));
      return ctx;
    } as typeof getContext;
    // live window/document listeners by type (removeEventListener and AbortSignal both count)
    w.__live = {};
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const watched = (t: EventTarget) => t === window || t === document || t === document.documentElement;
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, fn: unknown, opts?: unknown) {
      if (watched(this) && fn) {
        w.__live[type] = (w.__live[type] ?? 0) + 1;
        const signal = typeof opts === "object" && opts ? (opts as AddEventListenerOptions).signal : undefined;
        signal?.addEventListener("abort", () => (w.__live[type] -= 1));
      }
      return (add as (...a: unknown[]) => void).call(this, type, fn, opts);
    };
    EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, fn: unknown, opts?: unknown) {
      if (watched(this) && fn) w.__live[type] = (w.__live[type] ?? 0) - 1;
      return (remove as (...a: unknown[]) => void).call(this, type, fn, opts);
    };
  });
  await page.goto(`${PREVIEW}?nopanel`);
  await page.waitForFunction(() => (window.__ngWaves?.hero?.input.frame.time ?? 0) > 0.2);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const snapshot = async () => {
    await page.waitForTimeout(1200); // R3F disposes renderers ~500 ms after unmount
    await cdp.send("HeapProfiler.collectGarbage");
    const { metrics } = await cdp.send("Performance.getMetrics");
    const heap = metrics.find((m) => m.name === "JSHeapUsedSize")!.value;
    const s = await page.evaluate(() => {
      const w = window as unknown as { __contexts: WeakRef<WebGLRenderingContext>[]; __live: Record<string, number> };
      return {
        liveContexts: w.__contexts.filter((r) => {
          const c = r.deref();
          return c && !c.isContextLost();
        }).length,
        collectedContexts: w.__contexts.filter((r) => !r.deref()).length,
        createdContexts: w.__contexts.length,
        canvases: document.querySelectorAll("canvas").length,
        listeners: Object.fromEntries(Object.entries(w.__live).filter(([, n]) => n !== 0)),
        debugEntries: Object.keys(window.__ngWaves ?? {})
          .sort()
          .join(","),
      };
    });
    return { heapMB: +(heap / 1048576).toFixed(2), ...s };
  };

  /** Heap snapshot → bytes held by JS/DOM objects, excluding V8's compiled code (JIT warm-up). */
  const objectBytes = async () => {
    await cdp.send("HeapProfiler.collectGarbage");
    let json = "";
    const onChunk = (e: { chunk: string }) => (json += e.chunk);
    cdp.on("HeapProfiler.addHeapSnapshotChunk", onChunk);
    await cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false });
    cdp.off("HeapProfiler.addHeapSnapshotChunk", onChunk);
    const h = JSON.parse(json);
    const f: string[] = h.snapshot.meta.node_fields;
    const types: string[] = h.snapshot.meta.node_types[0];
    const [iT, iS, n] = [f.indexOf("type"), f.indexOf("self_size"), f.length];
    let bytes = 0;
    for (let i = 0; i < h.nodes.length; i += n) if (types[h.nodes[i + iT]] !== "code") bytes += h.nodes[i + iS];
    return bytes;
  };

  const cycle = async () => {
    await page.evaluate(() => window.__ngPreview!.setMounted(false));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__ngPreview!.setMounted(true));
    await page.waitForFunction(() => (window.__ngWaves?.hero?.input.frame.time ?? 0) > 0.1);
  };

  const start = await snapshot();
  for (let i = 0; i < 5; i++) await cycle();
  const after5 = await snapshot();
  const objects5 = await objectBytes();
  for (let i = 0; i < 15; i++) await cycle();
  const after20 = await snapshot();
  const objects20 = await objectBytes();
  await page.evaluate(() => window.__ngPreview!.setMounted(false));
  const unmounted = await snapshot();

  const objectGrowthKB = +((objects20 - objects5) / 1024).toFixed(1);
  const report = { start, after5, after20, unmounted, objectGrowthKB_5to20: objectGrowthKB };
  console.log(JSON.stringify(report, null, 1));
  await test.info().attach("leak", { body: JSON.stringify(report, null, 2), contentType: "application/json" });

  expect(after20.liveContexts).toBe(start.liveContexts); // hero + footer
  expect(after20.canvases).toBe(start.canvases);
  expect(after20.listeners).toEqual(start.listeners);
  expect(after20.debugEntries).toBe(start.debugEntries);
  expect(unmounted.liveContexts).toBe(start.liveContexts - 1);
  expect(unmounted.canvases).toBe(start.canvases - 1);
  // JSHeapUsedSize also counts V8's JIT code, which grows as hot paths tier up; the
  // object heap (everything but compiled code) is what must stay flat
  expect(objectGrowthKB).toBeLessThan(64);
  expect(warnings.filter((w) => /too many active/i.test(w))).toEqual([]);
});
