/**
 * NextGen waves: the shared maths.
 *
 * Every formula here has a twin in waves.glsl.ts. The Canvas 2D fallback and
 * the unit tests run these; the GPU runs the GLSL. Keep the two in step.
 */

export const RATIOS_MAJOR = [1, 1.25, 1.5, 2] as const; // S·A·T·B on a major chord
export const RATIOS_MINOR = [1, 1.2, 1.5, 2] as const; // the "chord change"
export const SEG = 260; // points per line
export const LINE_W = 6.4; // world width of a line
export const FOV = 32; // camera fov (deg)
export const PLUCK_LIFE = 3.5; // seconds before a ripple retires
export const MAX_PLUCKS = 3;
export const TAU = Math.PI * 2;

export type RGB = [number, number, number];

/** Camera distance: pulled back on narrow containers so the field fills a phone. */
export function cameraZFor(width: number) {
  return width < 700 ? 6.2 : 4.2;
}

/** How much of a line's length (0…1) the screen width covers. */
export function computeSpan(cameraZ: number, aspect: number, fovDeg = FOV) {
  const visibleW = 2 * Math.tan((fovDeg * Math.PI) / 360) * cameraZ * aspect;
  return Math.min(1, visibleW / LINE_W);
}

/** Screen x (0…1 across the container) → position along the line (0…1). */
export function screenToLine(x: number, span: number) {
  return 0.5 + (x - 0.5) * span;
}

export function lineToScreen(t: number, span: number) {
  return 0.5 + (t - 0.5) / span;
}

export function envelope(t: number) {
  const c = (t - 0.5) * 2.4;
  return Math.exp(-c * c);
}

/** Per-line look: soprano and every 5th tenor carry the accent; ribbon centres are brightest. */
export function lineStyle(v: number, j: number, density: number) {
  const centre = density > 1 ? 1 - Math.abs(j / (density - 1) - 0.5) * 2 : 1;
  const accent = v === 0 || (v === 2 && j % 5 === 0);
  return { accent, alpha: accent ? 0.22 + 0.5 * centre : 0.09 + 0.22 * centre };
}

export function lineDepth(v: number, j: number, density: number) {
  return (j - density / 2) * 0.05 + (v - 1.5) * 0.18;
}

export function chordRatios(mix: number, out: number[] = [0, 0, 0, 0]) {
  for (let i = 0; i < 4; i++) out[i] = RATIOS_MAJOR[i] + (RATIOS_MINOR[i] - RATIOS_MAJOR[i]) * mix;
  return out;
}

/** One ripple's vertical push at t. (px, age, amp) is a uPl entry; amp 0 = inactive. */
export function pluckY(t: number, px: number, age: number, amp: number, span: number, v: number, j: number) {
  if (amp <= 0) return 0;
  const d = Math.abs(t - px);
  const front = age * span * 0.55;
  const pk = (d - front) / (span * 0.07);
  const packet = Math.exp(-pk * pk);
  const lc = d / (span * 0.06);
  const local = Math.exp(-lc * lc) * Math.exp(-3 * age);
  const k = TAU / (span * 0.09);
  const ring = Math.sin(d * k - age * 16 + j * 0.15 + v * 0.8);
  return amp * Math.exp(-1.3 * age) * (packet * ring * (1 + 0.25 * v) + local * (0.9 - 0.3 * v));
}

export type WaveParams = {
  time: number;
  amp: number; // intensity × scroll breath
  ratio: number; // this voice's ratio
  mouseT: number; // swell centre (line space, already depth-corrected for this line)
  swellW: number;
  strength: number;
  bend: number;
  span: number;
  pl: ArrayLike<number>; // 9 floats: 3 × (x, age, amp)
  plT: ArrayLike<number>; // 3 corrected pluck x's for this line
};

/** Local-space y of line (v, j) at t: the same sum the vertex shader does. */
export function waveY(t: number, v: number, j: number, p: WaveParams) {
  const env = envelope(t);
  const g = (t - p.mouseT) / p.swellW;
  const swell = Math.exp(-g * g);
  const conductor = 1 + p.strength * swell;
  const y =
    Math.sin(TAU * p.ratio * t * 1.6 + p.time * (0.55 + 0.12 * v) + j * 0.085 + v * 1.7) +
    0.38 * Math.sin(TAU * p.ratio * 2 * t * 1.6 - p.time * 0.8 + j * 0.05);
  let ripple = 0;
  for (let i = 0; i < MAX_PLUCKS; i++) ripple += pluckY(t, p.plT[i], p.pl[i * 3 + 1], p.pl[i * 3 + 2], p.span, v, j);
  return (
    (v - 1.5) * 0.12 + env * p.amp * conductor * y * 0.42 + (0.35 + env) * ripple * 0.24 + p.bend * 0.3 * swell * env
  );
}

/* ───────────── camera / group projection (mirrors three.js) ───────────── */

/**
 * Group rotation (Euler XYZ, three's default) as a row-major 3×3:
 * R = Rx · Ry. Used by the 2D fallback and by the depth-exact swell mapping.
 */
export function groupRotation(rx: number, ry: number, out: Float64Array = new Float64Array(9)) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  out[0] = cy;      out[1] = 0;   out[2] = sy;
  out[3] = sx * sy; out[4] = cx;  out[5] = -sx * cy;
  out[6] = -cx * sy; out[7] = sx; out[8] = cx * cy;
  return out;
}

export type View = {
  cameraZ: number;
  tanHalf: number; // tan(fov/2)
  aspect: number;
  R: Float64Array; // groupRotation()
};

/**
 * The swell "lives" at screen x. For a line at local depth z, find which t on
 * that line sits under screen x, by casting a ray from the camera through
 * (ndcX, the line's own screen y) into the group's local space and hitting the
 * plane z = depth. Exact for every line, whatever the tilt and perspective.
 */
export function rayLineT(ndcX: number, baseY: number, depth: number, view: View) {
  const { R, cameraZ: cz, tanHalf, aspect } = view;
  const ox = R[6] * cz, oz = R[8] * cz; // camera in local space (Rᵀ·(0,0,cz))
  let x = 0;
  // two passes: take the line's screen y at the current hit, recast (converges to <1e-4 of the width)
  for (let pass = 0; pass < 2; pass++) {
    const wy = R[3] * x + R[4] * baseY + R[5] * depth;
    const wz = R[6] * x + R[7] * baseY + R[8] * depth;
    const ndcY = wy / (cz - wz) / tanHalf;
    // ray in world: D = (ndcX·tanHalf·aspect, ndcY·tanHalf, −1); local = Rᵀ·D
    const dx = ndcX * tanHalf * aspect, dy = ndcY * tanHalf, dz = -1;
    const lx = R[0] * dx + R[3] * dy + R[6] * dz;
    const lz = R[2] * dx + R[5] * dy + R[8] * dz;
    x = ox + lx * ((depth - oz) / lz);
  }
  return x / LINE_W + 0.5;
}

/** Line-space t (the spec's depth-0 mapping) → ndc x. */
export function lineToNdc(t: number, span: number) {
  return ((t - 0.5) / span) * 2;
}

/** Project a local point to pixel coords in a w×h viewport. Returns false if behind the camera. */
export function project(x: number, y: number, z: number, view: View, w: number, h: number, out: { x: number; y: number }) {
  const R = view.R;
  const wx = R[0] * x + R[1] * y + R[2] * z;
  const wy = R[3] * x + R[4] * y + R[5] * z;
  const wz = R[6] * x + R[7] * y + R[8] * z;
  const dz = view.cameraZ - wz;
  if (dz <= 0.01) return false;
  out.x = (1 + wx / dz / (view.tanHalf * view.aspect)) * 0.5 * w;
  out.y = (1 - wy / dz / view.tanHalf) * 0.5 * h;
  return true;
}

/* ───────────── colours ───────────── */

/** Parse "r, g, b", "#rrggbb"/"#rgb" or "rgb(r g b)" into 0–255 triplets. */
export function parseColor(raw: string | undefined | null): RGB | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
    if (!/^[0-9a-f]{6}$/i.test(full)) return null;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const nums = s.replace(/^rgba?\(|\)$/g, "").split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
  return nums.length === 3 && nums.every((n) => Number.isFinite(n)) ? (nums as RGB) : null;
}

export const DEFAULT_ACCENT: RGB = [222, 24, 44];
export const DEFAULT_SECONDARY: RGB = [128, 10, 24];
