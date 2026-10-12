"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { WaveInput } from "./useWaveInput";
import { registerDebug, type WaveColors } from "./waveDom";
import {
  FOV,
  LINE_W,
  MAX_PLUCKS,
  SEG,
  chordRatios,
  envelope,
  groupRotation,
  lineDepth,
  lineStyle,
  lineToNdc,
  project,
  rayLineT,
  waveY,
  type View,
  type WaveParams,
} from "./waveMath";

/**
 * Canvas 2D fallback: the same maths as the shader, projected through the
 * same camera and group tilt in JS, so it looks and reacts the same. Used when
 * WebGL2 is unavailable or the context is lost.
 */

export type WavesCanvas2DProps = {
  input: WaveInput;
  colors: RefObject<WaveColors>;
  density: number;
  intensity: number;
  running: boolean;
  reduced: boolean;
  lineWidth: number;
  maxDpr: number;
  exact: boolean;
  bloom: boolean;
  /** filled with a redraw function (used for colour changes while paused / reduced) */
  invalidateRef?: RefObject<(() => void) | null>;
  debugId?: string;
};

const smoothstep = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export function WavesCanvas2D(props: WavesCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const p = useRef(props);
  useEffect(() => {
    p.current = props;
  });
  const { input, running, reduced, maxDpr, invalidateRef, debugId } = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    let w = 1, h = 1, dpr = 1;
    const view: View = { cameraZ: 4.2, tanHalf: Math.tan((FOV * Math.PI) / 360), aspect: 1, R: new Float64Array(9) };
    const pt = { x: 0, y: 0 };
    const ratios = [0, 0, 0, 0];
    const plT = new Float64Array(MAX_PLUCKS);
    const params: WaveParams = { time: 0, amp: 1, ratio: 1, mouseT: 0.5, swellW: 0.4, strength: 0.9, bend: 0, span: 1, pl: input.frame.pl, plT };
    const stops = Array.from({ length: 9 }, (_, k) => k / 8);
    const stopAlpha = stops.map((t) => smoothstep(0.02, 0.5, envelope(t)));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, p.current.maxDpr);
      const cw = host.clientWidth, ch = host.clientHeight;
      canvas.width = Math.max(1, Math.round(cw * dpr));
      canvas.height = Math.max(1, Math.round(ch * dpr));
      w = canvas.width;
      h = canvas.height;
      input.setViewport(cw, ch);
    };

    const lineT = (t: number, baseY: number, depth: number, span: number) =>
      p.current.exact ? rayLineT(lineToNdc(t, span), baseY, depth, view) : t;

    const draw = (dt: number) => {
      const { density: L, intensity, colors, lineWidth, bloom } = p.current;
      const f = input.tick(dt);
      const span = input.state.span;
      view.cameraZ = input.state.cameraZ;
      view.aspect = w / h;
      groupRotation(-0.32 + (f.parY - 0.5) * 0.18, (f.parX - 0.5) * 0.35, view.R);
      chordRatios(f.chordMix, ratios);
      const { accent, secondary } = colors.current;
      params.time = f.time;
      params.amp = intensity * f.ampMul;
      params.swellW = f.swellW;
      params.strength = f.strength;
      params.bend = f.bend;
      params.span = span;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";

      for (let v = 0; v < 4; v++) {
        params.ratio = ratios[v];
        for (let j = 0; j < L; j++) {
          const depth = lineDepth(v, j, L);
          const baseY = (v - 1.5) * 0.12;
          params.mouseT = lineT(f.mouseT, baseY, depth, span);
          for (let i = 0; i < MAX_PLUCKS; i++) plT[i] = lineT(f.pl[i * 3], baseY, depth, span);
          const s = lineStyle(v, j, L);
          const [r, g, b] = s.accent ? accent : secondary;

          // the shader fades the ends with smoothstep(env): a horizontal gradient does the same here
          project(-LINE_W / 2, baseY, depth, view, w, h, pt);
          const x0 = pt.x;
          project(LINE_W / 2, baseY, depth, view, w, h, pt);
          const grad = ctx.createLinearGradient(x0, 0, pt.x, 0);
          for (let k = 0; k < stops.length; k++) grad.addColorStop(stops[k], `rgba(${r},${g},${b},${s.alpha * stopAlpha[k]})`);

          ctx.beginPath();
          for (let i = 0; i < SEG; i += 2) {
            const t = i / (SEG - 1);
            project((t - 0.5) * LINE_W, waveY(t, v, j, params), depth, view, w, h, pt);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = grad;
          if (bloom) {
            ctx.globalAlpha = 0.22;
            ctx.lineWidth = lineWidth * dpr * 4;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          ctx.lineWidth = lineWidth * dpr;
          ctx.stroke();
        }
      }
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(0);
    });
    ro.observe(host);
    resize();

    if (reduced) input.freezeTime(2);
    if (invalidateRef) invalidateRef.current = () => draw(0);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      draw((now - last) / 1000);
      last = now;
    };
    if (running && !reduced) raf = requestAnimationFrame(loop);
    else draw(0);

    const unregister = debugId
      ? registerDebug({
          id: debugId,
          mode: "2d",
          input,
          canvas,
          swellScreenX: () => {
            const L = p.current.density, j = Math.floor(L / 2), depth = lineDepth(0, j, L), baseY = -0.18;
            const t = lineT(input.frame.mouseT, baseY, depth, input.state.span);
            project((t - 0.5) * LINE_W, baseY, depth, view, w, h, pt);
            return pt.x / w;
          },
          pluckScreenX: (slot: number) => {
            const L = p.current.density, j = Math.floor(L / 2), depth = lineDepth(0, j, L), baseY = -0.18;
            const t = lineT(input.frame.pl[slot * 3], baseY, depth, input.state.span);
            project((t - 0.5) * LINE_W, baseY, depth, view, w, h, pt);
            return pt.x / w;
          },
        })
      : () => {};

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unregister();
      if (invalidateRef) invalidateRef.current = null;
    };
  }, [input, running, reduced, maxDpr, invalidateRef, debugId]);

  return <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />;
}
