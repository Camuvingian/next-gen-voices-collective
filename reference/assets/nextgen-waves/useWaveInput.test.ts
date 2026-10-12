import { describe, expect, it } from "vitest";
import { createWaveInput } from "./useWaveInput";
import {
  LINE_W,
  computeSpan,
  groupRotation,
  lineDepth,
  lineStyle,
  lineToNdc,
  parseColor,
  pluckY,
  project,
  rayLineT,
  screenToLine,
  type View,
} from "./waveMath";

const FRAME = 1 / 60;
const run = (input: ReturnType<typeof createWaveInput>, seconds: number) => {
  let f = input.tick(0);
  for (let i = 0; i < Math.round(seconds * 60); i++) f = input.tick(FRAME);
  return f;
};

describe("screen → line mapping", () => {
  it("desktop 1440×900: camera 4.2, span ≈ 0.602", () => {
    const input = createWaveInput();
    input.setViewport(1440, 900);
    expect(input.state.cameraZ).toBe(4.2);
    const expected = (2 * Math.tan((16 * Math.PI) / 180) * 4.2 * 1.6) / LINE_W;
    expect(input.state.span).toBeCloseTo(expected, 10);
    expect(input.state.span).toBeCloseTo(0.6019, 3);
    expect(input.screenToLine(0.5)).toBe(0.5);
    expect(input.screenToLine(0)).toBeCloseTo(0.5 - expected / 2, 10);
    expect(input.screenToLine(0.9)).toBeCloseTo(0.5 + 0.4 * expected, 10);
  });

  it("phone 390×844: camera pulls back to 6.2, span ≈ 0.257", () => {
    const input = createWaveInput();
    input.setViewport(390, 844);
    expect(input.state.cameraZ).toBe(6.2);
    expect(input.state.span).toBeCloseTo((2 * Math.tan((16 * Math.PI) / 180) * 6.2 * (390 / 844)) / LINE_W, 10);
    expect(input.state.span).toBeCloseTo(0.2567, 3);
  });

  it("span is capped at 1 on ultra-wide containers", () => {
    expect(computeSpan(4.2, 6)).toBe(1);
  });

  it("swell width is scaled by span, so it is the same physical size on every screen", () => {
    const desk = createWaveInput();
    desk.setViewport(1440, 900);
    const phone = createWaveInput();
    phone.setViewport(390, 844);
    const fd = desk.tick(0), wd = fd.swellW / desk.state.span;
    const fp = phone.tick(0), wp = fp.swellW / phone.state.span;
    expect(wd).toBeCloseTo(0.42, 10);
    expect(wp).toBeCloseTo(0.42, 10);
  });

  it("the swell eases to sit under the pointer", () => {
    const input = createWaveInput();
    input.setViewport(1440, 900);
    input.move(0.83, 0.5, 1000);
    const f = run(input, 1);
    expect(f.mouseT).toBeCloseTo(screenToLine(0.83, input.state.span), 4);
  });

  it("depth-exact mapping: every line's swell projects back to the pointer's screen x", () => {
    const span = computeSpan(4.2, 1.6);
    for (const [rx, ry] of [[-0.32, 0], [-0.41, 0.14], [-0.23, -0.17]]) {
      const view: View = { cameraZ: 4.2, tanHalf: Math.tan((16 * Math.PI) / 180), aspect: 1.6, R: groupRotation(rx, ry) };
      for (const sx of [0.1, 0.3, 0.5, 0.75, 0.95]) {
        for (const [v, j] of [[0, 0], [1, 8], [3, 15]]) {
          const depth = lineDepth(v, j, 16), baseY = (v - 1.5) * 0.12;
          const t = rayLineT(lineToNdc(screenToLine(sx, span), span), baseY, depth, view);
          const p = { x: 0, y: 0 };
          project((t - 0.5) * LINE_W, baseY, depth, view, 1440, 900, p);
          expect(Math.abs(p.x / 1440 - sx)).toBeLessThan(1e-4);
        }
      }
    }
  });
});

describe("energy", () => {
  it("grows with pointer speed and is capped at 1.6", () => {
    const input = createWaveInput();
    input.setViewport(1440, 900);
    // slow: 0.001 per 16 ms → 0.00375 per event
    input.move(0.5, 0.5, 0);
    input.move(0.501, 0.5, 16);
    expect(input.state.energy).toBeCloseTo((0.001 / 16) * 60, 10);
    // fast: each step is clamped to +0.5
    for (let i = 0; i < 10; i++) input.move(i % 2 ? 0.1 : 0.9, 0.5, 32 + i * 16);
    expect(input.state.energy).toBe(1.6);
  });

  it("faster movement gives a bigger, tighter swell", () => {
    const input = createWaveInput();
    input.setViewport(1440, 900);
    const calm = { ...input.tick(0) };
    input.move(0.2, 0.5, 0);
    input.move(0.4, 0.5, 16);
    input.move(0.6, 0.5, 32);
    const hot = input.tick(0);
    expect(hot.strength).toBeGreaterThan(calm.strength);
    expect(hot.swellW).toBeLessThan(calm.swellW);
    expect(hot.strength).toBeCloseTo(0.9 + 1.2 * 1.0, 10);
    expect(hot.swellW).toBeCloseTo(0.42 * input.state.span * 0.75, 10);
  });

  it("decays ×0.95 per 60 fps frame, and the same per second at 120 Hz", () => {
    const a = createWaveInput();
    a.state.energy = 1;
    for (let i = 0; i < 60; i++) a.tick(1 / 60);
    expect(a.state.energy).toBeCloseTo(Math.pow(0.95, 60), 10);
    const b = createWaveInput();
    b.state.energy = 1;
    for (let i = 0; i < 120; i++) b.tick(1 / 120);
    expect(b.state.energy).toBeCloseTo(a.state.energy, 10);
  });

  it("ignores the first move of a stroke and stale gaps (no spike after a pause)", () => {
    const input = createWaveInput();
    input.move(0.1, 0.5, 0);
    expect(input.state.energy).toBe(0);
    input.move(0.9, 0.5, 5000);
    expect(input.state.energy).toBe(0);
  });

  it("release keeps the swell where it was", () => {
    const input = createWaveInput();
    input.setViewport(1440, 900);
    input.move(0.2, 0.5, 0);
    run(input, 1);
    const before = input.frame.mouseT;
    input.release();
    const f = run(input, 2);
    expect(f.mouseT).toBeCloseTo(before, 6);
  });

  it("a pluck adds +0.6 energy", () => {
    const input = createWaveInput();
    input.pluck(0.5);
    expect(input.state.energy).toBeCloseTo(0.6, 10);
  });
});

describe("plucks", () => {
  it("ring buffer wraps around after 3 plucks, overwriting the oldest", () => {
    const input = createWaveInput();
    input.setViewport(1440, 900);
    const xs = [0.1, 0.3, 0.5, 0.7, 0.9];
    xs.forEach((x, i) => {
      input.pluck(x, 1 + i * 0.01);
      input.tick(0.05);
    });
    const f = input.frame;
    // slots: [3]→0, [4]→1, [2] remains
    expect(f.pl[0]).toBeCloseTo(screenToLine(0.7, input.state.span), 6);
    expect(f.pl[3]).toBeCloseTo(screenToLine(0.9, input.state.span), 6);
    expect(f.pl[6]).toBeCloseTo(screenToLine(0.5, input.state.span), 6);
    expect(f.pl[2]).toBeCloseTo(1.03, 6);
    expect(f.pl[5]).toBeCloseTo(1.04, 6);
    expect(f.pl[8]).toBeCloseTo(1.02, 6);
    expect(f.pl[1]).toBeCloseTo(0.1, 5); // ages (plucked at 0.15, 0.2, 0.1; now 0.25)
    expect(f.pl[4]).toBeCloseTo(0.05, 5);
    expect(f.pl[7]).toBeCloseTo(0.15, 5);
  });

  it("retires a ripple after 3.5 s", () => {
    const input = createWaveInput();
    input.pluck(0.5, 1.1);
    let f = run(input, 3.4);
    expect(f.pl[2]).toBeCloseTo(1.1, 6);
    expect(f.pl[1]).toBeCloseTo(3.4, 3);
    f = run(input, 0.2);
    expect(f.pl[2]).toBe(0);
    expect(f.pl[1]).toBe(0);
  });

  it("a pluck lands under the pointer in line space", () => {
    const input = createWaveInput();
    input.setViewport(390, 844);
    const t = input.pluck(0.8, 1.1);
    expect(t).toBeCloseTo(0.5 + 0.3 * input.state.span, 10);
  });

  it("the ripple packet travels outward from the pluck point", () => {
    const span = 0.6;
    const at = (age: number) => {
      let best = 0, bestD = 0;
      for (let d = 0; d <= 0.5; d += 0.001) {
        let m = 0;
        for (let j = 0; j < 16; j++) m = Math.max(m, Math.abs(pluckY(0.5 + d, 0.5, age, 1, span, 0, j)));
        if (d > span * 0.15 && m > best) [best, bestD] = [m, d];
      }
      return bestD;
    };
    expect(at(0.6)).toBeGreaterThan(at(0.3));
    expect(at(0.6)).toBeCloseTo(0.6 * span * 0.55, 1);
  });
});

describe("time and extras", () => {
  it("clamps long frames so a resumed tab never jumps", () => {
    const input = createWaveInput();
    input.tick(10);
    expect(input.frame.time).toBeCloseTo(0.05, 10);
  });

  it("freezeTime pins the clock (reduced motion renders time = 2.0)", () => {
    const input = createWaveInput();
    input.freezeTime(2);
    expect(run(input, 1).time).toBe(2);
  });

  it("chord change eases to minor and back, every 20 s", () => {
    const input = createWaveInput({ chordChanges: true });
    const mixes: number[] = [];
    for (let i = 0; i < 20 * 60; i++) mixes.push(input.tick(FRAME).chordMix);
    expect(Math.max(...mixes)).toBe(1);
    expect(mixes[60 * 5]).toBe(0);
    expect(mixes[mixes.length - 1]).toBeLessThan(0.01);
  });

  it("idle breath drifts the swell after 6 s without input on touch devices", () => {
    const input = createWaveInput({ idleBreath: true });
    input.setViewport(390, 844);
    input.setTouchDevice(true);
    input.move(0.5, 0.5, 0);
    expect(run(input, 5).idle).toBe(false);
    const a = run(input, 2).mouseT;
    const b = run(input, 2).mouseT;
    expect(input.frame.idle).toBe(true);
    expect(Math.abs(b - a)).toBeGreaterThan(0.01);
  });

  it("scroll speed breathes the amplitude, then settles", () => {
    const input = createWaveInput();
    input.scroll(0, 0);
    input.scroll(600, 100);
    const peak = Math.max(...Array.from({ length: 30 }, () => input.tick(FRAME).ampMul));
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.17);
    expect(run(input, 4).ampMul).toBeLessThan(1.005);
  });

  it("pinch widens the swell (only when enabled)", () => {
    const input = createWaveInput({ pinch: true });
    input.setViewport(390, 844);
    const base = input.tick(0).swellW;
    input.pinch(2);
    expect(run(input, 1).swellW).toBeGreaterThan(base * 1.9);
  });
});

describe("line style and colours", () => {
  it("accent lines are every soprano line plus every 5th tenor", () => {
    expect(lineStyle(0, 3, 16).accent).toBe(true);
    expect(lineStyle(2, 5, 16).accent).toBe(true);
    expect(lineStyle(2, 6, 16).accent).toBe(false);
    expect(lineStyle(1, 0, 16).accent).toBe(false);
    expect(lineStyle(0, 0, 16).alpha).toBeCloseTo(0.22, 10);
    expect(lineStyle(3, 0, 16).alpha).toBeCloseTo(0.09, 10);
  });

  it("parses CSS colour triplets and hex", () => {
    expect(parseColor(" 222, 24, 44")).toEqual([222, 24, 44]);
    expect(parseColor("#de182c")).toEqual([222, 24, 44]);
    expect(parseColor("rgb(1 2 3)")).toEqual([1, 2, 3]);
    expect(parseColor("")).toBeNull();
  });
});
