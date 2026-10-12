import { expect, test } from "@playwright/test";
import { PREVIEW } from "./helpers";

test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  },
});

test("vertex + fragment shaders compile and link in headless Chromium (SwiftShader)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  // record every shader compile and program link the page performs
  await page.addInitScript(() => {
    const log: { kind: string; ok: boolean; info: string; src?: string }[] = [];
    (window as unknown as { __glLog: typeof log }).__glLog = log;
    for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const compile = C.prototype.compileShader;
      C.prototype.compileShader = function (this: WebGL2RenderingContext, s: WebGLShader) {
        compile.call(this, s);
        const type = this.getShaderParameter(s, this.SHADER_TYPE) === this.VERTEX_SHADER ? "vertex" : "fragment";
        log.push({
          kind: type,
          ok: !!this.getShaderParameter(s, this.COMPILE_STATUS),
          info: this.getShaderInfoLog(s) ?? "",
          src: this.getShaderSource(s) ?? "",
        });
      };
      const link = C.prototype.linkProgram;
      C.prototype.linkProgram = function (this: WebGL2RenderingContext, p: WebGLProgram) {
        link.call(this, p);
        log.push({
          kind: "link",
          ok: !!this.getProgramParameter(p, this.LINK_STATUS),
          info: this.getProgramInfoLog(p) ?? "",
        });
      };
    }
  });
  await page.goto(`${PREVIEW}?nopanel&bloom=1`);
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2")!;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const log = (
      window as unknown as {
        __glLog: { kind: string; ok: boolean; info: string; src?: string }[];
      }
    ).__glLog;
    return {
      renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "",
      entries: log.map((e) => ({
        kind: e.kind,
        ok: e.ok,
        info: e.info.trim(),
        ours: !!e.src && /rayLineT|uBloom/.test(e.src),
        version: e.src?.split("\n")[0],
      })),
    };
  });
  console.log(`renderer: ${r.renderer}`);
  for (const e of r.entries)
    console.log(`${e.kind.padEnd(8)} ${e.ok ? "OK " : "ERR"} ${e.ours ? "(waves)" : ""} ${e.version ?? ""} ${e.info}`);

  expect(r.renderer).toMatch(/SwiftShader/);
  const ours = r.entries.filter((e) => e.ours);
  expect(ours.map((e) => e.kind).sort()).toEqual(["fragment", "vertex"]); // hero + footer share one cached program
  for (const e of r.entries) expect(e.ok, `${e.kind}: ${e.info}`).toBe(true);
  expect(r.entries.filter((e) => e.kind === "link").length).toBeGreaterThan(0);
  expect(errors.filter((e) => /shader|WebGL|THREE/i.test(e))).toEqual([]);
});
