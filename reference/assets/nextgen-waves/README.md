# NextGen waves

The "reactive waves" behind the hero and the footer CTA. Four voices (soprano, alto, tenor, bass) of luminous red lines, tuned to a major chord. The swell follows the mouse, or the finger on a phone (including while the page scrolls), and a click or tap plucks a ripple that travels outward.

Open `preview.html` straight from disk to try it. It is self-contained and works offline. It has a control panel for every prop and colour, and an unmount button.

## Files

| File | What |
| --- | --- |
| `NextGenWaves.tsx` | The component: an R3F `<Canvas>` with one instanced draw call |
| `NextGenWavesLazy.tsx` | The `next/dynamic({ ssr: false })` wrapper. **Use this one in pages.** |
| `waves.glsl.ts` | Vertex and fragment shaders (commented GLSL in template strings) |
| `waveMath.ts` | The same maths in TypeScript, used by the 2D fallback and the tests |
| `useWaveInput.ts` | Pointer, touch, pluck and energy logic. `createWaveInput()` has no DOM, so it's unit-tested. |
| `waveDom.ts` | Theme colours (MutationObserver), visibility, WebGL detection, test hook |
| `WavesCanvas2D.tsx` | Canvas 2D fallback, projected through the same camera |
| `NextGenWaves.css` | Container sizing only |
| `Example.tsx` | Hero and footer usage |
| `preview.html` | Offline demo (built by `pnpm build:waves-preview`) |
| `useWaveInput.test.ts` | Vitest unit tests |

## Install

```bash
pnpm add three@0.186.1 @react-three/fiber@9.8.1
pnpm add -D @types/three@0.186.0
```

The component needs React 19 and Next 16 (App Router). drei isn't needed: the ribbon is a custom instanced mesh.

## Use it in a Next.js page

`ssr: false` only works inside a Client Component, so import the lazy wrapper. three.js then loads in its own chunk after hydration and never ships in the initial bundle.

```tsx
"use client";
import { NextGenWavesLazy } from "@/components/nextgen-waves/NextGenWavesLazy";

<section style={{ position: "relative", overflow: "hidden", isolation: "isolate" }}>
  <NextGenWavesLazy className="ng-hero-field" />
  <h1>Young voices. One sound.</h1>
</section>
```

The waves fill their nearest positioned ancestor (`position: absolute; inset: 0`). The canvas has `pointer-events: none` and the component is `aria-hidden`, so everything above stays clickable. Input is read from `window` and hit-tested against the container.

On this site the hero and footer go through `src/components/noir/SiteWaves.tsx`. It has one `ENGINE` switch: `"nextgen"` (this component) or `"harmonic"` (the original `HarmonicField`, kept as a fallback).

## Props

All props are optional.

| Prop | Default | |
| --- | --- | --- |
| `density` | `16` | Lines per voice (×4 voices) |
| `intensity` | `1` | Wave amplitude |
| `interactive` | `true` | Follow the pointer or finger, and pluck |
| `plucks` | `true` | Click and tap ripples. The `ref.pluck()` method works either way. |
| `maxDpr` | `2` | Cap on device pixel ratio |
| `colors` | | `{ accent?, secondary? }` as `"r, g, b"` or `#hex`. Overrides the CSS variables. |
| `className`, `style` | | Applied to the container |
| `onPluck` | | `(xNorm) => void`, called on each click or tap pluck (screen x from 0 to 1) |
| `ref` | | `{ pluck(xNorm, amp = 1) }` lets other UI (e.g. the piano) start a ripple |
| `lineWidth` | `1.25` | Line width in CSS px, constant at any DPR |
| `exactSwell` | `true` | Casts the pointer into each line's own depth, so the swell sits exactly under it on every line (see "The maths") |
| `scrollCoupling` | `true` | Amplitude breathes slightly with scroll speed |
| `pinch` | `false` | Two-finger pinch widens the swell, and finger height bends the ribbon up or down |
| `idleBreath` | `false` | On touch devices, after 6 s idle the swell drifts slowly across the field |
| `chordChanges` | `false` | Every 20 s the alto eases to a minor third (2 s), holds 5 s, then eases back (2 s) |
| `bloom` | `false` | Soft in-shader halo. The ribbon widens to a Gaussian glow, with no post-processing pass. |
| `forceFallback` | `false` | Always use the Canvas 2D renderer |

## Theming

The colours come from CSS custom properties on `<html>`, written as `r, g, b` triplets:

```css
:root {
  --ng-glow: 222, 24, 44;   /* accent: soprano and every 5th tenor line */
  --ng-glow-2: 128, 10, 24; /* secondary: oxblood */
}
```

A MutationObserver re-reads them whenever any `<html>` attribute changes (class, `style`, `data-*`). The new colours are written into uniforms on the next frame, and the animation doesn't restart.

## The maths

Notation: t = position along a line (0 to 1), v = voice (0 to 3), j = line within its voice, ratios = [1, 1.25, 1.5, 2].

```
env       = exp(-((t − 0.5)·2.4)²)
conductor = 1 + strength · exp(-((t − mouseT)/width)²)
y         = sin(2π·ratio·t·1.6 + time·(0.55 + 0.12v) + 0.085j + 1.7v) + 0.38·sin(2π·ratio·2t·1.6 − 0.8·time + 0.05j)
position  = ((t − 0.5)·6.4,  (v − 1.5)·0.12 + env·intensity·conductor·y·0.42 + (0.35 + env)·ripple·0.24,  depth)
depth     = (j − density/2)·0.05 + (v − 1.5)·0.18
```

Line alpha is `0.22 + 0.5·centre` for accent lines and `0.09 + 0.22·centre` for the rest, multiplied by `smoothstep(0.02, 0.5, env)`. Lines blend additively.

**Mapping the screen to a line.** A line is 6.4 world units wide, wider than the screen. `span = min(1, 2·tan(fov/2)·cameraZ·aspect / 6.4)`, and then `mouseT = 0.5 + (screenX − 0.5)·span`. All widths in line space are multiplied by span, so the swell is the same physical size on a phone and on a desktop. The camera is fov 32 at z = 4.2, or 6.2 when the container is under 700 px wide.

**Exact swell (`exactSwell`).** The span formula is exact only at depth 0. Lines in front of or behind that plane are magnified or shrunk by perspective (up to about 10%), and the parallax tilt shifts them further. So the vertex shader casts a ray from the camera through the pointer's screen x, at the line's own screen height, into the group's local space, and intersects it with the plane z = depth. It does two passes, so the screen height is taken at the hit point. The result is that the swell sits under the pointer on every line, at any tilt. Plucks use the same mapping.

**Following the input.**

- `energy += min(0.5, |Δx|/Δt(ms)·60)`, capped at 1.6. It decays by `0.95^(dt·60)`, which is ×0.95 per frame at 60 fps and the same per second at 120 Hz.
- `width = 0.42·span·(1 − 0.25·min(1, energy))` and `strength = 0.9 + 1.2·energy`.
- The swell eases to the target at 0.25 per frame (it should feel attached to the finger). The parallax eases at 0.08 on x and 0.06 on y: `rotation.x = −0.32 + (y − 0.5)·0.18`, `rotation.y = (x − 0.5)·0.35`.
- On phones, the swell is driven by `touchstart` and `touchmove` (passive). Browsers fire `pointercancel` as soon as a scroll starts, but touch events keep coming while the page scrolls.

**Plucks.** Plucks use a ring buffer of three slots, `uPl[i] = (x, age, amp)`. Touch plucks have amplitude 1.1 and mouse plucks 1.0. Each pluck adds 0.6 energy, and a ripple retires after 3.5 s.

```
d = |t − x|,  front = age·span·0.55
packet = exp(-((d − front)/(span·0.07))²)
local  = exp(-(d/(span·0.06))²)·exp(-3·age)
ring   = sin(d·2π/(span·0.09) − 16·age + 0.15j + 0.8v)
ripple = amp·exp(-1.3·age)·(packet·ring·(1 + 0.25v) + local·(0.9 − 0.3v))
```

**Lines.** Each line is a ribbon extruded in screen space. The vertex shader evaluates the curve at t and at the neighbouring point, projects both, and offsets the vertex along the screen-space normal by `lineWidth·dpr/2`. A 1 px feather in the fragment shader anti-aliases the edges, so MSAA is off.

## Performance notes

- **One draw call.** One `InstancedBufferGeometry` (260 points × 2 sides) is instanced 64 times; per-line data (voice, line index, depth, alpha, accent) lives in instance attributes. There is one material, so the uniforms aren't copied per line. That's 33k triangles.
- **CPU.** The CPU writes about a dozen uniforms per frame and allocates nothing. Measured on a Pixel 7 viewport with a 4× CPU throttle: 0.16 ms average and 0.6 ms p95 per frame, at 60 fps with no long tasks.
- **Pausing.** Rendering stops (`frameloop="never"`) when the component is offscreen (IntersectionObserver) or the tab is hidden. The clock is our own and clamps each frame to 50 ms, so resuming never jumps.
- **Reduced motion.** With `prefers-reduced-motion`, the component renders one still frame (time = 2.0) and attaches no interaction listeners.
- **Resizing.** R3F's ResizeObserver resizes the canvas; the 2D fallback has its own. DPR is capped at `maxDpr`.
- **Fallback.** Without WebGL2, or after `webglcontextlost`, the same maths is drawn with Canvas 2D, through the same camera and tilt in JS.
- **Unmount.** Geometry, material, renderer, listeners (an AbortController) and observers are all released. Twenty mount/unmount cycles leave the live WebGL contexts, canvases and listeners flat.

## Tests

```bash
pnpm test        # Vitest: mapping, energy, ring buffer, retirement, extras
pnpm test:e2e    # builds preview.html, then Playwright: desktop, iPhone 13 (WebKit), Pixel 7, perf
```

The e2e tests read `window.__ngWaves[debugId]`. This hook only exists when `window.__NG_WAVES_DEBUG__` is set before the component mounts.
