"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { clamp, useFrame, useMotion } from "./motion";
export interface HarmonicFieldProps {
  density?: number;
  intensity?: number;
  interactive?: boolean;
  className?: string;
}
/** Four perspective ribbons. Canvas2D deliberately avoids a WebGL/runtime dependency. */
export function HarmonicField({
  density = 12,
  intensity = 1,
  interactive = true,
  className = "",
}: HarmonicFieldProps) {
  const ref = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const motion = useMotion(ref);
  const state = useRef({
    w: 800,
    h: 450,
    dpr: 1,
    x: 0.5,
    y: 0.5,
    tx: 0.5,
    ty: 0.5,
    energy: 0,
    ripple: -8,
    rx: 0.5,
    a: "#de182c",
    b: "#800a18",
  });
  const redraw = useRef(() => {});
  useEffect(() => {
    const host = ref.current!,
      c = canvas.current!;
    const resize = () => {
      const s = state.current;
      s.w = host.clientWidth;
      s.h = host.clientHeight;
      s.dpr = Math.min(devicePixelRatio || 1, 1.5);
      c.width = s.w * s.dpr;
      c.height = s.h * s.dpr;
      redraw.current();
    };
    const colour = () => {
      const style = getComputedStyle(host),
        s = state.current;
      s.a = `rgb(${style.getPropertyValue("--ng-glow").trim() || "222,24,44"})`;
      s.b = `rgb(${style.getPropertyValue("--ng-glow-2").trim() || "128,10,24"})`;
      redraw.current();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const mo = new MutationObserver(colour);
    for (let el: Element | null = host; el; el = el.parentElement)
      mo.observe(el, {
        attributes: true,
        attributeFilter: ["data-ng-hl", "data-ng-theme", "class", "style"],
      });
    resize();
    colour();
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
  const last = useRef(3.4);
  function draw(t: number, dt: number) {
    last.current = t;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const s = state.current,
      { w, h, dpr } = s;
    const smooth = 1 - Math.exp(-dt * 7);
    s.x += (s.tx - s.x) * smooth;
    s.y += (s.ty - s.y) * smooth;
    s.energy *= Math.exp(-dt * 1.5);
    s.ripple += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const lines = clamp(Math.floor(density), 3, w < 600 ? 9 : 20),
      steps = w < 600 ? 110 : 190;
    const chord = 0.5 - 0.5 * Math.cos((t * Math.PI) / 20);
    const ratios = [1, 1.25 - 0.05 * chord, 1.5, 2];
    ctx.globalCompositeOperation = "lighter";
    for (let voice = 3; voice >= 0; voice--) {
      for (let j = 0; j < lines; j++) {
        const z = j / lines - 0.5,
          bright = 1 - Math.abs(z) * 1.5;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps,
            env = Math.pow(Math.sin(u * Math.PI), 1.3);
          const conductor =
            1 + (0.35 + s.energy) * Math.exp(-Math.pow((u - s.x) * 5, 2));
          const pulse =
            s.ripple > 0 && s.ripple < 3
              ? Math.sin((Math.abs(u - s.rx) - s.ripple * 0.4) * 42) *
                Math.exp(
                  -Math.pow((Math.abs(u - s.rx) - s.ripple * 0.4) * 10, 2),
                ) *
                Math.exp(-s.ripple)
              : 0;
          const wave =
            Math.sin(
              u * Math.PI * 3.2 * ratios[voice] +
                t * (0.33 + voice * 0.06) +
                voice * 1.5 +
                j * 0.07,
            ) +
            0.3 * Math.sin(u * Math.PI * 7 - t * 0.55 + j * 0.09);
          const x = u * w;
          const y =
            h * 0.54 +
            (voice - 1.5) * h * 0.034 +
            z * h * 0.17 +
            env *
              (wave + pulse) *
              h *
              0.16 *
              clamp(intensity, 0, 2) *
              conductor +
            (u - 0.5) * (s.y - 0.5) * h * 0.22;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = voice === 0 || voice === 2 ? s.a : s.b;
        ctx.globalAlpha = (0.18 + bright * 0.34) * (voice === 0 ? 1 : 0.78);
        ctx.lineWidth = j === Math.floor(lines / 2) ? 1.7 : 0.75;
        ctx.stroke();
        if (j === Math.floor(lines / 2)) {
          ctx.globalAlpha = 0.045;
          ctx.lineWidth = 8;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  useLayoutEffect(() => {
    redraw.current = () => draw(last.current, 0);
  });
  useFrame(motion.active, motion.reduced, draw);
  // Site adaptation: the hero copy and buttons sit above the field, so the
  // pointer is read from window and hit-tested against the field's box.
  const live = interactive && motion.active;
  useEffect(() => {
    if (!live) return;
    const host = ref.current!;
    const ac = new AbortController();
    const opts = { passive: true, signal: ac.signal };
    const at = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width,
        y = (e.clientY - r.top) / r.height;
      return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
    };
    const centre = () => {
      state.current.tx = 0.5;
      state.current.ty = 0.5;
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        const p = at(e),
          s = state.current;
        if (!p) return centre();
        s.energy = Math.min(1.4, s.energy + Math.abs(p.x - s.tx) * 3);
        s.tx = p.x;
        s.ty = p.y;
      },
      opts,
    );
    window.addEventListener(
      "pointerdown",
      (e) => {
        const p = at(e);
        if (!p) return;
        state.current.rx = p.x;
        state.current.ripple = 0;
      },
      opts,
    );
    document.documentElement.addEventListener("mouseleave", centre, opts);
    return () => ac.abort();
  }, [live]);
  return (
    <div
      ref={ref}
      className={`nm-field ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvas} />
      <div className="nm-field-haze" />
    </div>
  );
}
