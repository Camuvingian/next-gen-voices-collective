"use client";

import { useEffect, useRef } from "react";

/**
 * HarmonicField — the 3D signature of the site.
 *
 * Four "voices" (S·A·T·B) of luminous lines, tuned to the ratios of a
 * major chord (4:5:6:8). Each voice is a ribbon of slightly delayed
 * copies, so the lines drift apart and re-converge: individual voices,
 * one blend. The pointer acts like a conductor — the field swells where
 * it moves.
 *
 * Rendering: three.js ShaderMaterial on THREE.Line (all motion lives in
 * the vertex shader, so the CPU cost is a single uniform update/frame).
 * In production this file becomes an @react-three/fiber <Canvas> with
 * the same shaders inside <shaderMaterial>.
 * Fallback: if three.js / WebGL is unavailable, the same maths is drawn
 * with Canvas 2D so the hero never renders empty.
 */

type Props = {
  className?: string;
  /** lines per voice */
  density?: number;
  /** overall amplitude multiplier */
  intensity?: number;
  /** follow the pointer */
  interactive?: boolean;
};

const RATIOS = [1, 1.25, 1.5, 2]; // major triad + octave
const SEG = 260;

// Same function used by the shader and the 2D fallback.
function wave(t: number, v: number, j: number, time: number, mx: number, amp: number) {
  const c = (t - 0.5) * 2.4;
  const env = Math.exp(-c * c);
  const f = RATIOS[v];
  const conductor = 1 + 0.9 * Math.exp(-(((t - mx) * 4) ** 2));
  const y =
    Math.sin(6.2832 * f * t * 1.6 + time * (0.55 + 0.12 * v) + j * 0.085 + v * 1.7) +
    0.38 * Math.sin(6.2832 * f * 2 * t * 1.6 - time * 0.8 + j * 0.05);
  return { y: (v - 1.5) * 0.12 + env * amp * conductor * y * 0.42, env };
}

const VERT = /* glsl */ `
  attribute float aT;
  uniform float uTime, uVoice, uJ, uRatio, uAmp, uWidth, uMouse, uDepth;
  varying float vEnv;
  void main() {
    float t = aT;
    float c = (t - 0.5) * 2.4;
    float env = exp(-c * c);
    float conductor = 1.0 + 0.9 * exp(-pow((t - uMouse) * 4.0, 2.0));
    float y = sin(6.2832 * uRatio * t * 1.6 + uTime * (0.55 + 0.12 * uVoice) + uJ * 0.085 + uVoice * 1.7)
            + 0.38 * sin(6.2832 * uRatio * 2.0 * t * 1.6 - uTime * 0.8 + uJ * 0.05);
    vec3 p = vec3((t - 0.5) * uWidth, (uVoice - 1.5) * 0.12 + env * uAmp * conductor * y * 0.42, uDepth);
    vEnv = env;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vEnv;
  void main() {
    gl_FragColor = vec4(uColor, uAlpha * smoothstep(0.02, 0.5, vEnv));
  }
`;

function readRGB(name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(",").map((n) => parseFloat(n));
  return parts.length === 3 && parts.every((n) => !Number.isNaN(n)) ? (parts as [number, number, number]) : fallback;
}

function lineStyle(v: number, j: number, L: number) {
  // Soprano carries the accent; others are bone. Centre of each ribbon brightest.
  const centre = 1 - Math.abs(j / (L - 1) - 0.5) * 2;
  const accent = v === 0 || (v === 2 && j % 5 === 0);
  return { accent, alpha: (accent ? 0.22 : 0.09) + centre * (accent ? 0.5 : 0.22) };
}

export function HarmonicField({ className, density = 16, intensity = 1, interactive = true }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const L = density;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let visible = true;
    let raf = 0;
    let cleanup: () => void = () => {};

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = (e.clientY - r.top) / r.height;
    };
    if (interactive) window.addEventListener("pointermove", onMove, { passive: true });

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- three.js comes from a global until the R3F port (Phase 4)
    const THREE = (window as unknown as { THREE?: any }).THREE;
    let webgl = false;
    if (THREE) {
      try {
        const test = document.createElement("canvas");
        webgl = !!(test.getContext("webgl2") || test.getContext("webgl"));
      } catch {
        webgl = false;
      }
    }

    if (THREE && webgl) {
      // ───────────── three.js path ─────────────
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0, 4.2);
      const group = new THREE.Group();
      group.rotation.x = -0.32;
      scene.add(group);

      const shared = {
        uTime: { value: 0 },
        uMouse: { value: 0.5 },
        uAmp: { value: intensity },
        uWidth: { value: 6.4 },
      };
      const glow = readRGB("--ng-glow", [255, 212, 0]);
      const bone = readRGB("--ng-glow-2", [120, 160, 215]);
      const accentColor = new THREE.Color(glow[0] / 255, glow[1] / 255, glow[2] / 255);
      const boneColor = new THREE.Color(bone[0] / 255, bone[1] / 255, bone[2] / 255);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- three.js comes from a global until the R3F port (Phase 4)
      const mats: any[] = [];

      const ts = new Float32Array(SEG);
      const pos = new Float32Array(SEG * 3);
      for (let i = 0; i < SEG; i++) ts[i] = i / (SEG - 1);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aT", new THREE.BufferAttribute(ts, 1));
      // positions are computed in the shader; give a generous bounding sphere
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

      for (let v = 0; v < 4; v++) {
        for (let j = 0; j < L; j++) {
          const s = lineStyle(v, j, L);
          const mat = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
              ...shared,
              uVoice: { value: v },
              uJ: { value: j },
              uRatio: { value: RATIOS[v] },
              uDepth: { value: (j - L / 2) * 0.05 + (v - 1.5) * 0.18 },
              uColor: { value: s.accent ? accentColor : boneColor },
              uAlpha: { value: s.alpha },
            },
          });
          mats.push(mat);
          group.add(new THREE.Line(geo, mat));
        }
      }

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        camera.aspect = w / Math.max(h, 1);
        // keep the field filling the width on narrow screens
        camera.position.z = w < 700 ? 6.2 : 4.2;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      // recolour on theme switch
      const mo = new MutationObserver(() => {
        const g = readRGB("--ng-glow", glow);
        const b = readRGB("--ng-glow-2", bone);
        accentColor.setRGB(g[0] / 255, g[1] / 255, g[2] / 255);
        boneColor.setRGB(b[0] / 255, b[1] / 255, b[2] / 255);
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ng-hl"] });

      const start = performance.now();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        shared.uTime.value = reduced ? 2.0 : (performance.now() - start) / 1000;
        shared.uMouse.value = interactive ? pointer.x : 0.5;
        group.rotation.y = (pointer.x - 0.5) * 0.35;
        group.rotation.x = -0.32 + (pointer.y - 0.5) * 0.18;
        renderer.render(scene, camera);
      };
      if (reduced) {
        resize();
        tick();
        cancelAnimationFrame(raf);
      } else tick();

      cleanup = () => {
        ro.disconnect();
        mo.disconnect();
        mats.forEach((m) => m.dispose());
        geo.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    } else {
      // ───────────── Canvas 2D fallback ─────────────
      const canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      el.appendChild(canvas);
      const ctx = canvas.getContext("2d")!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const resize = () => {
        canvas.width = el.clientWidth * dpr;
        canvas.height = el.clientHeight * dpr;
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();
      const start = performance.now();
      const draw = () => {
        const w = canvas.width;
        const h = canvas.height;
        const time = reduced ? 2 : (performance.now() - start) / 1000;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        const glow = readRGB("--ng-glow", [255, 212, 0]);
        const bone = readRGB("--ng-glow-2", [120, 160, 215]);
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineWidth = dpr;
        const scaleY = h * (w < 700 * dpr ? 0.42 : 0.55);
        for (let v = 0; v < 4; v++) {
          for (let j = 0; j < L; j++) {
            const s = lineStyle(v, j, L);
            const depth = (j - L / 2) * 0.05 + (v - 1.5) * 0.18;
            const persp = 1 / (1 - depth * 0.25);
            const [r, g, b] = s.accent ? glow : bone;
            ctx.strokeStyle = `rgba(${r},${g},${b},${s.alpha})`;
            ctx.beginPath();
            for (let i = 0; i < SEG; i += 2) {
              const t = i / (SEG - 1);
              const { y } = wave(t, v, j, time, interactive ? pointer.x : 0.5, intensity);
              const px = w / 2 + (t - 0.5) * w * 1.05 * persp;
              const py = h / 2 - y * scaleY * persp + depth * h * 0.18;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
        }
      };
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        draw();
      };
      if (reduced) draw();
      else tick();
      cleanup = () => {
        ro.disconnect();
        canvas.remove();
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      cleanup();
    };
  }, [density, intensity, interactive]);

  return <div ref={host} className={["ng-field", className].join(" ")} aria-hidden="true" />;
}
