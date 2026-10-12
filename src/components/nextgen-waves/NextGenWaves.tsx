"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type Ref, type RefObject } from "react";
import * as THREE from "three";
import { WavesCanvas2D } from "./WavesCanvas2D";
import { usePrefersReducedMotion, useWaveInput, type WaveInput } from "./useWaveInput";
import { debugEnabled, hasWebGL2, registerDebug, useInView, useWaveColors, type ColorOverrides, type WaveColors } from "./waveDom";
import { WAVES_FRAG, WAVES_VERT } from "./waves.glsl";
import { FOV, LINE_W, SEG, chordRatios, lineDepth, lineStyle, lineToNdc, rayLineT, groupRotation } from "./waveMath";
import "./NextGenWaves.css";

/**
 * NextGen waves: the "reactive waves" behind the hero and the footer CTA.
 *
 * Four voices (S·A·T·B) of luminous lines on a major chord. The swell follows
 * the mouse or finger (also while the page scrolls), and a click or tap plucks
 * a ripple that travels outward. Everything moves in one instanced draw call;
 * the CPU writes a dozen uniforms per frame. Falls back to Canvas 2D (same
 * maths) without WebGL2 or after a lost context.
 *
 * Load it with next/dynamic({ ssr: false }) so three.js stays out of the
 * initial bundle. See README.md.
 */

export type NextGenWavesHandle = {
  /** start a ripple at screen x (0…1 across the component) */
  pluck: (xNorm: number, amp?: number) => void;
};

export type NextGenWavesProps = {
  /** lines per voice (×4 voices) */
  density?: number;
  /** wave amplitude */
  intensity?: number;
  /** follow the pointer / finger and pluck */
  interactive?: boolean;
  /** click / tap ripples */
  plucks?: boolean;
  /** device pixel ratio cap */
  maxDpr?: number;
  /** override --ng-glow / --ng-glow-2 ("r, g, b" or #hex) */
  colors?: ColorOverrides;
  className?: string;
  style?: CSSProperties;
  /** fired on each click/tap pluck, with screen x 0…1 */
  onPluck?: (xNorm: number) => void;
  ref?: Ref<NextGenWavesHandle>;

  /** line width in CSS px */
  lineWidth?: number;
  /** cast the pointer into each line's own depth, so the swell sits exactly under it on every line */
  exactSwell?: boolean;
  /** amplitude breathes with scroll speed (subtle) */
  scrollCoupling?: boolean;
  /** two-finger pinch widens the swell; finger height bends the ribbon */
  pinch?: boolean;
  /** touch devices: after 6 s idle the swell drifts across the field */
  idleBreath?: boolean;
  /** every ~20 s the alto eases to a minor third and back */
  chordChanges?: boolean;
  /** soft in-shader glow (no post-processing) */
  bloom?: boolean;
  /** force the Canvas 2D renderer */
  forceFallback?: boolean;
  /** key for the test hook (window.__ngWaves[debugId]); only used when window.__NG_WAVES_DEBUG__ is set */
  debugId?: string;
};

type Mode = "pending" | "webgl" | "2d";

// WebGL2 support never changes during a session: detect once, read it like an external store.
let webgl2Cache: boolean | null = null;
const noSubscribe = () => () => {};
const webgl2Snapshot = () => (webgl2Cache ??= hasWebGL2());
const serverSnapshot = () => null;

export function NextGenWaves({
  density = 16,
  intensity = 1,
  interactive = true,
  plucks = true,
  maxDpr = 2,
  colors: colorOverrides,
  className,
  style,
  onPluck,
  ref,
  lineWidth = 1.25,
  exactSwell = true,
  scrollCoupling = true,
  pinch = false,
  idleBreath = false,
  chordChanges = false,
  bloom = false,
  forceFallback = false,
  debugId: debugKey,
}: NextGenWavesProps) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const input = useWaveInput(host, {
    interactive,
    plucks,
    scrollCoupling,
    pinch,
    idleBreath,
    chordChanges,
    disabled: reduced,
    onPluck,
  });
  const invalidate = useRef<(() => void) | null>(null);
  const colors = useWaveColors(colorOverrides, () => invalidate.current?.());
  const inView = useInView(host);
  const [lost, setLost] = useState(false);
  const webgl2 = useSyncExternalStore(noSubscribe, webgl2Snapshot, serverSnapshot);
  const mode: Mode = forceFallback || lost || webgl2 === false ? "2d" : webgl2 ? "webgl" : "pending";
  const id = useId();
  const debugId = debugEnabled() ? (debugKey ?? id) : undefined;

  useEffect(() => {
    input.freezeTime(reduced ? 2 : null);
    invalidate.current?.();
  }, [input, reduced]);

  useImperativeHandle(ref, () => ({ pluck: (x, amp = 1) => void input.pluck(x, amp) }), [input]);

  const running = inView && !reduced;
  const shared = { input, colors, density, intensity, lineWidth, exact: exactSwell, bloom, debugId, invalidateRef: invalidate };

  return (
    <div ref={host} className={className ? `ng-waves ${className}` : "ng-waves"} style={style} aria-hidden="true" data-mode={mode}>
      {mode === "webgl" && (
        <Canvas
          className="ng-waves-canvas"
          style={{ pointerEvents: "none" }}
          dpr={[1, maxDpr]}
          frameloop={reduced ? "demand" : running ? "always" : "never"}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: FOV, near: 0.1, far: 50, position: [0, 0, 4.2] }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            const canvas = gl.domElement;
            const lost = () => {
              // R3F forces a context loss when it disposes; only a live canvas falls back
              if (canvas.isConnected) setLost(true);
            };
            canvas.addEventListener("webglcontextlost", lost, { once: true });
          }}
        >
          <WaveScene {...shared} />
        </Canvas>
      )}
      {mode === "2d" && <WavesCanvas2D {...shared} running={running} reduced={reduced} maxDpr={maxDpr} />}
    </div>
  );
}

export default NextGenWaves;

/* ───────────── the scene ───────────── */

type SceneProps = {
  input: WaveInput;
  colors: RefObject<WaveColors>;
  density: number;
  intensity: number;
  lineWidth: number;
  exact: boolean;
  bloom: boolean;
  debugId?: string;
  invalidateRef: RefObject<(() => void) | null>;
};

/** One ribbon template (SEG × 2 vertices) instanced once per line. */
function buildGeometry(density: number) {
  const geo = new THREE.InstancedBufferGeometry();
  const pos = new Float32Array(SEG * 2 * 3);
  for (let i = 0; i < SEG; i++) {
    const t = i / (SEG - 1);
    pos.set([t, -1, 0, t, 1, 0], i * 6);
  }
  const index: number[] = [];
  for (let i = 0; i < SEG - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(index);

  const n = density * 4;
  const line = new Float32Array(n * 4);
  const accent = new Float32Array(n);
  for (let v = 0, k = 0; v < 4; v++) {
    for (let j = 0; j < density; j++, k++) {
      const s = lineStyle(v, j, density);
      line.set([v, j, lineDepth(v, j, density), s.alpha], k * 4);
      accent[k] = s.accent ? 1 : 0;
    }
  }
  geo.setAttribute("aLine", new THREE.InstancedBufferAttribute(line, 4));
  geo.setAttribute("aAccent", new THREE.InstancedBufferAttribute(accent, 1));
  geo.instanceCount = n;
  return geo;
}

function makeUniforms(): Record<string, THREE.IUniform> {
  return {
    uTime: { value: 0 },
    uAmp: { value: 1 },
    uRatios: { value: new THREE.Vector4(1, 1.25, 1.5, 2) },
    uSpan: { value: 1 },
    uMouseT: { value: 0.5 },
    uSwellW: { value: 0.42 },
    uStrength: { value: 0.9 },
    uBend: { value: 0 },
    uPl: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uExact: { value: 1 },
    uRot: { value: new THREE.Matrix3() },
    uCamZ: { value: 4.2 },
    uTanHalf: { value: Math.tan((FOV * Math.PI) / 360) },
    uAspect: { value: 1 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uHalfWidth: { value: 1 },
    uLineWidth: { value: 1 },
    uBloom: { value: 0 },
    uAccent: { value: new THREE.Vector3(222 / 255, 24 / 255, 44 / 255) },
    uSecondary: { value: new THREE.Vector3(128 / 255, 10 / 255, 24 / 255) },
  };
}

const scratch = { ratios: [0, 0, 0, 0], buf: new THREE.Vector2() };

function WaveScene({ input, colors, density, intensity, lineWidth, exact, bloom, debugId, invalidateRef }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const viewport = useRef({ w: 0, h: 0 });
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => buildGeometry(density), [density]);
  const uniforms = useMemo(() => makeUniforms(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);

  useFrame((state, delta) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const cam = state.camera as THREE.PerspectiveCamera;

    // container size → camera distance + span
    const vp = viewport.current;
    if (vp.w !== state.size.width || vp.h !== state.size.height) {
      vp.w = state.size.width;
      vp.h = state.size.height;
      input.setViewport(vp.w, vp.h);
      cam.position.z = input.state.cameraZ;
      cam.updateProjectionMatrix();
    }

    const f = input.tick(delta);
    const u = m.uniforms;
    u.uTime.value = f.time;
    u.uAmp.value = intensity * f.ampMul;
    const r = chordRatios(f.chordMix, scratch.ratios);
    (u.uRatios.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    u.uSpan.value = input.state.span;
    u.uMouseT.value = f.mouseT;
    u.uSwellW.value = f.swellW;
    u.uStrength.value = f.strength;
    u.uBend.value = f.bend;
    const pl = u.uPl.value as THREE.Vector3[];
    for (let i = 0; i < 3; i++) pl[i].set(f.pl[i * 3], f.pl[i * 3 + 1], f.pl[i * 3 + 2]);

    g.rotation.set(-0.32 + (f.parY - 0.5) * 0.18, (f.parX - 0.5) * 0.35, 0);
    g.updateMatrixWorld();
    (u.uRot.value as THREE.Matrix3).setFromMatrix4(g.matrixWorld);
    u.uExact.value = exact ? 1 : 0;
    u.uCamZ.value = cam.position.z;
    u.uAspect.value = cam.aspect;

    state.gl.getDrawingBufferSize(scratch.buf);
    (u.uResolution.value as THREE.Vector2).copy(scratch.buf);
    const dpr = state.gl.getPixelRatio();
    u.uLineWidth.value = lineWidth * dpr;
    u.uBloom.value = bloom ? 1 : 0;
    u.uHalfWidth.value = bloom ? lineWidth * dpr * 3 : lineWidth * dpr * 0.5 + 1;

    const c = colors.current;
    (u.uAccent.value as THREE.Vector3).set(c.accent[0] / 255, c.accent[1] / 255, c.accent[2] / 255);
    (u.uSecondary.value as THREE.Vector3).set(c.secondary[0] / 255, c.secondary[1] / 255, c.secondary[2] / 255);
  });

  // tests: where does the swell peak on screen, through the live three.js camera?
  useEffect(() => {
    if (!debugId) return;
    const v = new THREE.Vector3();
    const screenX = (tLine: number) => {
      const g = group.current;
      if (!g) return NaN;
      const j = Math.floor(density / 2), depth = lineDepth(0, j, density), baseY = -0.18;
      const cam = camera as THREE.PerspectiveCamera;
      const view = { cameraZ: cam.position.z, tanHalf: Math.tan((FOV * Math.PI) / 360), aspect: cam.aspect, R: groupRotation(g.rotation.x, g.rotation.y) };
      const t = exact ? rayLineT(lineToNdc(tLine, input.state.span), baseY, depth, view) : tLine;
      v.set((t - 0.5) * LINE_W, baseY, depth).applyMatrix4(g.matrixWorld).project(camera);
      return (v.x + 1) / 2;
    };
    return registerDebug({
      id: debugId,
      mode: "webgl",
      input,
      gl,
      material: () => mat.current,
      canvas: gl.domElement,
      swellScreenX: () => screenX(input.frame.mouseT),
      pluckScreenX: (slot: number) => screenX(input.frame.pl[slot * 3]),
    });
  }, [debugId, input, gl, camera, density, exact]);

  return (
    <group ref={group}>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={mat}
          vertexShader={WAVES_VERT}
          fragmentShader={WAVES_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide} // screen-space ribbon: facing is meaningless
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

