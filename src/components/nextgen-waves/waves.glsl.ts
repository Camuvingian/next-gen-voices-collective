/**
 * NextGen waves: GLSL (three.js ShaderMaterial, WebGL2 / GLSL ES 3.00).
 *
 * One instanced draw: the template is a ribbon of SEG points × 2 sides
 * (position.x = t along the line, position.y = side ±1) and each instance is
 * one line (aLine = voice, index-in-voice, depth, alpha; aAccent = 0|1).
 * All motion happens here; the CPU only writes uniforms. Every formula is
 * mirrored in waveMath.ts. Change both together.
 */

export const WAVES_VERT = /* glsl */ `
  attribute vec4 aLine;      // voice v (0–3), line j, depth, alpha
  attribute float aAccent;   // 1 = accent colour

  uniform float uTime;
  uniform float uAmp;        // intensity × scroll breath
  uniform vec4  uRatios;     // S·A·T·B frequency ratios (major, easing to minor)
  uniform float uSpan;       // fraction of a line the screen width covers
  uniform float uMouseT;     // swell centre, line space (depth-0 mapping)
  uniform float uSwellW;     // swell width, line space
  uniform float uStrength;   // swell height
  uniform float uBend;       // −1…1, finger height (gesture extra)
  uniform vec3  uPl[3];      // plucks: (x line space, age s, amp); amp 0 = off

  uniform float uExact;      // 1 = cast the pointer into each line's own depth
  uniform mat3  uRot;        // group rotation (camera is unrotated, so this is local → view)
  uniform float uCamZ;
  uniform float uTanHalf;    // tan(fov/2)
  uniform float uAspect;

  uniform vec2  uResolution; // drawing buffer, device px
  uniform float uHalfWidth;  // ribbon half-width incl. AA fringe / halo, device px

  varying float vEnv;
  varying float vAlpha;
  varying float vAccent;
  varying float vEdge;       // signed distance from the ribbon centre, device px

  const float TAU = 6.28318530718;
  const float LINE_W = 6.4;

  // Which t on this line sits under screen x = ndcX? Ray from the camera through
  // (ndcX, the line's own screen y), intersected with the line's plane z = depth.
  // Two passes so the screen y is taken at the hit point. Mirrors rayLineT().
  float rayLineT(float ndcX, float baseY, float depth) {
    mat3 toLocal = transpose(uRot);
    vec3 o = toLocal * vec3(0.0, 0.0, uCamZ);
    float x = 0.0;
    for (int pass = 0; pass < 2; pass++) {
      vec3 w = uRot * vec3(x, baseY, depth);
      float ndcY = w.y / (uCamZ - w.z) / uTanHalf;
      vec3 d = toLocal * vec3(ndcX * uTanHalf * uAspect, ndcY * uTanHalf, -1.0);
      x = o.x + d.x * (depth - o.z) / d.z;
    }
    return x / LINE_W + 0.5;
  }

  float lineT(float t, float baseY, float depth) {
    return uExact > 0.5 ? rayLineT((t - 0.5) / uSpan * 2.0, baseY, depth) : t;
  }

  // One ripple. d = distance along the line; a packet travels outward from the
  // pluck point while a short "push" sits under the finger.
  float pluckY(float t, float px, float age, float amp, float v, float j) {
    if (amp <= 0.0) return 0.0;
    float d      = abs(t - px);
    float front  = age * uSpan * 0.55;
    float pk     = (d - front) / (uSpan * 0.07);
    float packet = exp(-pk * pk);
    float lc     = d / (uSpan * 0.06);
    float local  = exp(-lc * lc) * exp(-3.0 * age);
    float k      = TAU / (uSpan * 0.09);
    float ring   = sin(d * k - age * 16.0 + j * 0.15 + v * 0.8);  // per-line phase: the ribbon shimmers
    return amp * exp(-1.3 * age) * (packet * ring * (1.0 + 0.25 * v) + local * (0.9 - 0.3 * v));
  }

  vec3 linePos(float t, float v, float j, float depth, float mT, vec3 plT, out float env) {
    float c = (t - 0.5) * 2.4;
    env = exp(-c * c);                                    // fade the line ends
    float ratio = uRatios[int(v + 0.5)];
    float g = (t - mT) / uSwellW;
    float swell = exp(-g * g);
    float conductor = 1.0 + uStrength * swell;            // swell under the pointer
    float y = sin(TAU * ratio * t * 1.6 + uTime * (0.55 + 0.12 * v) + j * 0.085 + v * 1.7)
            + 0.38 * sin(TAU * ratio * 2.0 * t * 1.6 - uTime * 0.8 + j * 0.05);
    float ripple = pluckY(t, plT.x, uPl[0].y, uPl[0].z, v, j)
                 + pluckY(t, plT.y, uPl[1].y, uPl[1].z, v, j)
                 + pluckY(t, plT.z, uPl[2].y, uPl[2].z, v, j);
    return vec3((t - 0.5) * LINE_W,
                (v - 1.5) * 0.12 + env * uAmp * conductor * y * 0.42 + (0.35 + env) * ripple * 0.24
                  + uBend * 0.3 * swell * env,
                depth);
  }

  void main() {
    float v = aLine.x, j = aLine.y, depth = aLine.z;
    float baseY = (v - 1.5) * 0.12;
    float t = position.x;
    float side = position.y;

    // per-line (constant per instance) pointer and pluck positions
    float mT = lineT(uMouseT, baseY, depth);
    vec3 plT = vec3(lineT(uPl[0].x, baseY, depth), lineT(uPl[1].x, baseY, depth), lineT(uPl[2].x, baseY, depth));

    float env, envN;
    float dt = t < 0.999 ? 1.0 / 259.0 : -1.0 / 259.0;
    vec3 p = linePos(t, v, j, depth, mT, plT, env);
    vec3 q = linePos(t + dt, v, j, depth, mT, plT, envN);

    // screen-space extrusion: constant pixel width at any depth and DPR
    vec4 cp = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vec4 cq = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
    vec2 hres = uResolution * 0.5;  // ("half" is reserved in GLSL ES)
    vec2 dir = (cq.xy / cq.w - cp.xy / cp.w) * hres * sign(dt);
    vec2 n = normalize(vec2(-dir.y, dir.x) + 1e-6);
    cp.xy += n * side * uHalfWidth / hres * cp.w;

    vEnv = env;
    vAlpha = aLine.w;
    vAccent = aAccent;
    vEdge = side * uHalfWidth;
    gl_Position = cp;
  }
`;

export const WAVES_FRAG = /* glsl */ `
  uniform vec3  uAccent;     // --ng-glow, 0–1
  uniform vec3  uSecondary;  // --ng-glow-2, 0–1
  uniform float uLineWidth;  // core width, device px
  uniform float uBloom;      // 0 = off; >0 adds a soft in-shader halo

  varying float vEnv;
  varying float vAlpha;
  varying float vAccent;
  varying float vEdge;

  void main() {
    float d = abs(vEdge);
    // coverage of a uLineWidth-wide line at this pixel (1 px AA fringe)
    float core = clamp(uLineWidth * 0.5 + 0.5 - d, 0.0, 1.0);
    float g = d / (uLineWidth * 1.8);
    float glow = uBloom * 0.32 * exp(-g * g);
    float a = vAlpha * smoothstep(0.02, 0.5, vEnv) * (core + glow);
    if (a < 0.002) discard;
    gl_FragColor = vec4(mix(uSecondary, uAccent, vAccent), a);
  }
`;
