# NextGen Voice Collective — Animation Prompt Pack

One copy-paste prompt per animation, written for Astra (or any coding/animation agent). Each prompt is self-contained: brand context, exact behaviour and timings of the current version, technical constraints, acceptance criteria, and a "push it further" brief so the agent improves rather than just reproduces.

The current working code for every animation is in `nextgen-animations-code.zip` (folder names match the numbers below). Attach the matching folder to the agent alongside its prompt, so it can start from the real implementation.

## Contents

| # | Animation | Current files |
|---|---|---|
| 1 | Harmonic wave field (3D background) | `components/HarmonicField.tsx` |
| 2 | Neon sign (glass tube, ignite, random flicker) | `components/NeonDirector.tsx`, `theme/noir.css` (neon block) |
| 3 | Wordmark shimmer | `theme/noir.css` (shimmer block) |
| 4 | Stage-curtain page transition | `lib/router.tsx`, `components/Chrome.tsx` (Curtain), `theme/styles.css` |
| 5 | Headline word-rise + scroll reveals | `components/ui/index.tsx` (RiseText, Reveal), `theme/styles.css` |
| 6 | Piano Rail (scroll chord + sampled piano) | `assets/piano-rail/` (the whole asset) |
| 7 | Pillar card: Blend (notes into unison) | `components/PillarCard.tsx`, `theme/noir.css` |
| 8 | Pillar card: Harmony (arpeggio into chord) | `components/PillarCard.tsx`, `theme/noir.css` |
| 9 | Pillar card: Precision (metronome) | `components/PillarCard.tsx`, `theme/noir.css` |
| 10 | Pillar card: Presence (spotlight and mic) | `components/PillarCard.tsx`, `theme/noir.css` |
| 11 | Film grain + projector vignette | `theme/noir.css` (grain block) |
| 12 | Marquee ticker | `components/ui/index.tsx` (Marquee), `theme/styles.css` |
| 13 | Buttons (hover fill, glass gradient) | `components/ui/index.tsx` (Button), `theme/styles.css`, `theme/noir.css` |
| 14 | Gallery masonry entrance + lightbox | `pages/Gallery.tsx`, `components/Lightbox.tsx` |
| 15 | Application form: step transitions, progress, upload, success | `pages/Auditions.tsx`, `components/Uploader.tsx` |
| 16 | Interlock logo (your supplied asset) | `components/NextGenLogo.tsx`, `components/NextGenLogo.css` |

**Shared brand context** (already embedded in each prompt): NextGen Voice Collective is an elite, audition-based vocal ensemble for singers aged 13–18 in London. The site's art direction is **Noir Club**: a 1920s–30s supper club in black and white, with film grain, silver and ivory, and colour only in the deep-red logo, the red sound waves and one neon colour. Fonts: Limelight (deco caps), Yellowtail (neon script), Jost (body), Josefin Sans (labels and buttons). React 19 + TypeScript, themed entirely through CSS custom properties (`theme/tokens.css`).

**Global rules for every animation**

- React 19 + TypeScript (strict), client component (`"use client"` for Next.js). No new runtime dependency unless the prompt allows one.
- Colours come only from CSS custom properties, read at runtime. The animation must re-read them when the `<html>` attribute `data-ng-hl` (the neon colour) changes, without restarting.
- `prefers-reduced-motion: reduce` gives a finished, attractive static frame.
- Pause when offscreen (IntersectionObserver) and when the tab is hidden. Clean up timers, observers, RAF and GL resources on unmount.
- 60 fps on a mid-range phone; no layout thrash; transform/opacity/filter only for DOM motion.
- Content must be readable at rest: never leave text at opacity 0 waiting for JS.

---

## 1. Harmonic wave field (3D background)

```text
ROLE: You are a senior creative developer (WebGL / three.js / React Three Fiber).

CONTEXT: NextGen Voice Collective is an elite youth vocal ensemble (ages 13–18). The hero and footer of its site sit on a full-bleed, slowly moving field of luminous sine-wave lines that represent voices. Visitors love that the waves swell as the mouse moves over them; that interaction must be kept and made better.

WHAT IT IS NOW (reproduce first, then improve):
- Four "voices" (soprano, alto, tenor, bass) tuned to a major chord: frequency ratios 1, 1.25, 1.5, 2 (4:5:6:8).
- Each voice is a ribbon of 16 slightly delayed copies (64 lines in total). Each line has 260 points; ALL motion is computed in the vertex shader from one uniform update per frame.
- Per point, with t = 0..1 along the line:
    env = exp(-((t - 0.5) * 2.4)^2)                      // fades the ends
    conductor = 1 + 0.9 * exp(-((t - mouseX) * 4)^2)       // swell under the pointer
    y = sin(2π·ratio·t·1.6 + time·(0.55 + 0.12·voice) + j·0.085 + voice·1.7)
      + 0.38·sin(2π·ratio·2·t·1.6 − time·0.8 + j·0.05)
    position = ((t − 0.5)·6.4,  (voice − 1.5)·0.12 + env·amp·conductor·y·0.42,  depth)
    depth = (j − 16/2)·0.05 + (voice − 1.5)·0.18
- Fragment alpha = lineAlpha · smoothstep(0.02, 0.5, env). Additive blending, no depth write.
- Soprano lines (and every 5th tenor line) use the accent colour; the rest use the secondary colour. The centre of each ribbon is brightest.
- Camera: perspective, fov 32, z = 4.2 (6.2 under 700px wide). Group tilt rotation.x = −0.32 + (pointerY − 0.5)·0.18, rotation.y = (pointerX − 0.5)·0.35. Pointer eased by 0.05 per frame.
- Colours from CSS vars: --ng-glow (rgb triplet, accent lines) = 222,24,44 and --ng-glow-2 (rgb triplet, other lines) = 128,10,24: a deep red gradient on black.
- If WebGL is unavailable, a Canvas 2D fallback draws the same maths.

BUILD: A React component <HarmonicField density intensity interactive className />, built with @react-three/fiber + @react-three/drei (allowed) and a custom shaderMaterial. Expose props for density (lines per voice), intensity (amplitude) and interactive. Keep the Canvas 2D fallback.

PUSH IT FURTHER (pick the best, explain the choices):
- A real "conductor" response: pointer velocity adds energy that decays; a click/tap sends a ripple along the lines.
- Optional scroll coupling: amplitude breathes slightly with scroll velocity.
- Subtle bloom or fake glow in the shader (no heavy post-processing on mobile).
- Lines thicker than 1px (MeshLine or instanced quads) so the field looks rich on retina without losing performance.
- A "chord change" every ~20 s: ratios ease to another chord (minor: 1, 1.2, 1.5, 2) and back.
- Respect reduced motion: render one beautiful still frame.

ACCEPTANCE: 60 fps on an iPhone 12-class device at full width; under 2 ms CPU per frame; colours update live when the CSS vars change; no memory leaks on remount; the mouse swell is at least as responsive as today; Canvas fallback renders when WebGL is disabled.
```

---

## 2. Neon sign (glass tube, ignite, random flicker)

```text
ROLE: You are a senior front-end motion designer specialising in photoreal CSS/SVG effects.

CONTEXT: In the Noir Club style (1920s–30s, black and white), every emphasised word is a real-looking neon sign: the hero line "One sound.", the word "and" in "selected for their voice and their discipline", "every single week." and others. The font is Yellowtail (script). The neon colour comes from CSS vars: --hl (hex) and --hl-rgb (triplet). Default is red #ff2e3f; the user can switch to ruby, white, blue, pink or violet.

WHAT IT IS NOW (reproduce first, then improve):
- Look: text filled with a vertical gradient clipped to the glyphs (background-clip:text): white 0–18% (hot core and specular streak), then mixes of --hl with white at 34%, 58%, 80% and 100%. A 0.5px text-stroke in rgba(hl, .55). Layered text-shadow glow: 0 0 1px white, 0 0 4px hl .95, 10px .85, 22px .65, 48px .45, 96px .28.
- The hero sign also casts light on the wall: a blurred radial gradient of rgba(hl, .22) behind it.
- States, driven by classes from a small controller component:
    unlit: filter brightness(.28) saturate(.7) (dark glass tube)
    .is-igniting (2.6s): a stutter, brightness 0.2 → 1.15 → 0.22 → 1 → 0.3 → 1.1 → 0.45 → 1.05 (by 27%), one dip to 0.6 at 46%, steady from 48%
    .is-lit: steady
    .is-flicker (1.3s): 1 → 0.25 → 1.05 → (hold) → 0.3 → 0.95 → 0.4 → 1
- Controller timing: each sign ignites the first time ≥40% of it is visible. The hero waits 900 ms (after the headline has risen); others wait 150–500 ms. Afterwards, every 8–15 s (random), one visible sign flickers; the hero sign is chosen 65% of the time when it is on screen.
- Word-rise masks inside signs are forced inline, because background-clip:text ignores inline-block children.

BUILD: A <NeonText as="em"|"span" intensity="hero"|"inline">…</NeonText> component plus a tiny NeonDirector (or a hook) that owns the timing, works across route changes, and needs no class juggling by consumers. Keep it pure CSS for the glow (no canvas), so it stays crisp and selectable text.

PUSH IT FURTHER:
- Make it more photoreal: (a) the tube visible behind the light, i.e. a darker, slightly thicker duplicate stroke beneath the glow; (b) tiny unevenness along the tube (a subtle SVG turbulence mask) so the brightness isn't perfectly uniform; (c) small dark "electrode" caps at the start and end of each word; (d) mounting clips and a faint backplate shadow for the hero sign only.
- A realistic flicker model: buzzing micro-flicker (2–4% brightness at 50–120 Hz-looking jitter, very subtle) plus occasional big dropouts, with one letter-group able to fail independently on the hero sign (for example "sound" flickers while "One" holds).
- Optional faint electrical hum on ignite, only after the user has interacted with sound elsewhere (the piano): never autoplay.
- The wall glow responds to the flicker in sync.
- Reduced motion: lit, no flicker.

ACCEPTANCE: Reads as real neon at 1× and 3× DPR; text stays selectable and accessible (no duplicated text read twice by screen readers); no layout shift; under 1 ms main-thread per flicker; flicker intervals truly random within 8–15 s; colour switches live with --hl.
```

---

## 3. Wordmark shimmer

```text
ROLE: Senior UI motion designer.

CONTEXT: The site's nav shows the wordmark "NEXTGEN" (Limelight, art-deco caps, off-white #f1efea on near-black) above "Voice Collective" in Yellowtail script. A light sheen crosses the wordmark every 8 seconds.

NOW: background-clip:text gradient at 105deg: fg 0–42%, #ffffff 47%, #ffd9dc 50% (a whisper of the red brand), #ffffff 53%, fg 58–100%; background-size 320% 100%; position animates 100% → 0% over the first 14% of an 8 s loop (≈1.1 s sweep), with a brief drop-shadow bloom at the peak; 1.5 s initial delay; infinite.

BUILD: A <Shimmer interval={8} delay={1.5}> wrapper or a CSS utility class that works on any text (wordmark, footer lockup), theme-aware via CSS vars, paused when offscreen, off for reduced motion.

PUSH IT FURTHER: a sheen that behaves like light on polished chrome (narrow bright core plus a wider soft falloff), a slight letter-by-letter catch-light as the sweep passes, and an optional sync with the logo's own shimmer (asset 16) so the logo shines first and the wordmark follows 300 ms later.

ACCEPTANCE: Smooth on Safari iOS and Chrome; no repaint of the whole nav; the text stays crisp; 8 s cadence ±50 ms.
```

---

## 4. Stage-curtain page transition

```text
ROLE: Senior React motion engineer (Next.js App Router + Motion).

CONTEXT: Changing page on the NextGen site feels like a stage curtain: a full-screen panel sweeps up from the bottom, the logo draws itself in the middle, the new page swaps underneath, and the panel continues upward to reveal it.

NOW:
- Phases: cover (panel translateY 100% → 0 over 620 ms, cubic-bezier(.76,0,.24,1)); the page swaps at 820 ms and scrolls to top (or to an anchor); reveal (0 → −100% over 760 ms); idle at 1650 ms (panel hidden, visibility:hidden).
- The panel carries a strip of piano-key stripes on its leading edge. The panel colour is --ng-curtain (near-black).
- The logo (asset 16) remounts on each cover and plays a shortened 2.4 s draw.
- Respects reduced motion: instant swap.

BUILD: Port it to Next.js App Router using a template.tsx with Motion's AnimatePresence (or the View Transitions API with a Motion fallback). Intercept internal <Link> navigations so the cover completes before the route renders; support back/forward; never block keyboard focus. Move focus to the new page's <h1> after reveal.

PUSH IT FURTHER: a velvet-curtain variant (two panels parting from the centre with a subtle fabric fold shading done in CSS gradients), and the logo's tracer finishing exactly as the reveal starts.

ACCEPTANCE: No flash of the old page after reveal; total under 1.7 s; works with prefetching; no layout shift; Lighthouse CLS 0.
```

---

## 5. Headline word-rise and scroll reveals

```text
ROLE: Senior front-end motion engineer.

CONTEXT: Big headlines on NextGen ("Young voices. One sound.", page titles) rise in word by word from behind an invisible mask on load; sections below the fold ease up as they scroll into view.

NOW:
- RiseText: each word is wrapped in an overflow-hidden inline-block mask; the inner word animates translateY(105%) → 0 over 1 s with ease-out cubic-bezier(.16,1,.3,1), staggered 70 ms. The whole phrase has an aria-label; the words are aria-hidden.
- Reveal: only elements that START below the fold are held back (opacity 0, translateY 32px), then animate in over 900 ms when they enter (rootMargin bottom −8%). Anything visible on load is left at rest, so thumbnails and first paint are complete.
- Hero lede and buttons fade up (16px) at 600 ms and 750 ms.

BUILD: <RiseText text stagger delay /> and <Reveal delay as /> using Motion (allowed). Server-render the text so it's visible without JS, and avoid layout shift. Provide a variant that works with gradient or neon text (background-clip:text cannot see through inline-block masks; use clip-path on the line instead).

PUSH IT FURTHER: line-aware splitting (rise per line rather than per word on mobile), a tiny skew-and-settle on each word, and scroll-linked parallax on section headings (2–4% only).

ACCEPTANCE: No CLS; works without JS; reduced motion shows everything at rest; no element remains hidden if IntersectionObserver is unavailable.
```

---

## 6. Piano rail (scroll triad and real sampled piano)

```text
ROLE: Senior creative developer (Web Audio + React).

CONTEXT: A piano keyboard can slide out along the left edge of the site. It is packaged as a standalone asset (assets/piano-rail/: NextGenPianoRail.tsx, NextGenPianoRail.css, pianoEngine.ts, pianoSamples.ts, README.md, preview.html); improve the asset in place and keep its props API. It's hidden by default and toggled by a subtle floating glass button bottom-left (it bobs gently, 4px, every 5 s, and expands to show "Piano" on hover). As you scroll, a moving chord travels down the keys; you can also play it.

NOW:
- Layout: fixed, full-height rail, 60px wide on desktop and 26px on mobile. White keys are 30px tall (24px mobile) and run horizontally from the left wall. Black keys are 62% of the width and 62% of the white key's height, centred on the white-key boundary, in the standard pattern (after C, D, F, G, A). Top key = C3 (MIDI 48); pitch rises down the page.
- Keys: ivory gradient whites with an inset highlight; glossy blacks. A pressed key scales on X to 0.965, darkens, and shows a glowing --hl edge on its tip. The lead key has a stronger glow.
- Scroll: p = scrollY / (scrollHeight − innerHeight). The lead white key index = round(p · (whiteCount − 5)). That key, plus the keys two and four white keys below it (a triad shape), are shown pressed.
- Intro: on open, a glissando ripples down the keys (28 ms stagger).
- Sound: a real acoustic grand, 21 samples (C3–C8, every minor third), each note re-pitched from the nearest sample by playbackRate 2^((midi − root)/12), so at most ±1 semitone. Velocity gain is v². Release (noteOff) applies a damper: setTargetAtTime(0, now, 0.09), stop at +0.6 s. A synthesised convolution reverb (2.2 s, darkened noise IR) at 28% wet.
- Pointer: press to play, hold to sustain, drag across keys for a glissando (pointerenter while the pointer is down). The ♪ button at the foot of the rail makes scrolling play the lead note (off by default; the browser needs a tap first). Turning it on plays a C-major arpeggio to confirm.
- Current samples come from a GPL soundfont: replace them (see the push list).
- Body content shifts right by the rail width when open (600 ms ease-in-out); the nav shifts too.

BUILD: keep the asset's public API (<NextGenPianoRail open defaultOpen onOpenChange showToggle showSoundButton persistKey baseMidi keyHeight scrollTriad pushContent />, data-ngp-open on <html>, --ngp-* CSS variables) and the engine module (loadPiano, noteOn, noteOff, strike). No audio libraries required; Tone.js is allowed if it adds real value. Rebuild preview.html when done.

PUSH IT FURTHER:
- Swap in a properly licensed multi-velocity sample set (for example Salamander Grand Piano, CC-BY 3.0, 2–3 velocity layers, every minor third, OGG plus MP3 fallback, lazy-loaded only when the rail opens). Add release samples and a sympathetic-resonance tail if feasible.
- Musical scroll: map the scroll to a ii–V–I progression in a jazz voicing (Dm9 → G13 → Cmaj9) rather than a plain triad, quantised so notes land on an 8th-note grid at about 92 bpm; scrolling fast gives a run, slow gives held chords.
- Keyboard input (A–L row plays the white keys) and MIDI input via Web MIDI where available.
- Visual: hammer-strike micro-bounce, felt-damper shadow, and the ivory catching the neon glow from the hero sign.
- Accessibility: the rail is decorative; provide aria-pressed on the toggle; sound never autoplays; respect reduced motion (no glissando).

ACCEPTANCE: The correct pitch for every key (verify against A4 = 440 Hz); press-to-sound latency under 30 ms after the first interaction; no clicks or pops on release; sample loading never blocks the page; works on iOS Safari (unlock audio on the first touch).
```

---

## 7. Noir pillar card: Blend (notes glide into unison)

```text
ROLE: Senior SVG motion designer.

CONTEXT: Four "pillar" cards explain what NextGen rehearses: Blend, Harmony, Precision, Presence. Each has a 16:9 animated card that looks like a vintage art-deco sheet-music placard: near-black card, a double silver rule with deco corner fans (three concentric quarter-arcs per corner), a faint 5-line staff, and a small Josefin Sans caps label bottom-right. The accent colour is --hl (neon red by default); the notes are paper white (--ng-fg).

BLEND NOW (viewBox 320×180, 4.2 s loop):
- Staff lines at y = 60, 75, 90, 105, 120 (x 30–290).
- Three quarter notes start at x = 70 on y = 60, 90 and 120 (the middle one accented in --hl). Faint dashed guide curves run from each start to the target (240, 90).
- Keyframes: fade in by 8%, hold until 18%, glide 18–58% along translate(170px, dy) where dy = +30, 0, −30, then fade out by 62%.
- At 57–62% a single accented "unison" note appears at (240, 90) with a red drop-shadow glow, holds until 88%, and a ring expands from scale 0.6 to 2.6 while fading.
- Label "UNISON".

BUILD: A React <BlendCard /> in SVG + CSS (or Motion for SVG), paused offscreen, reduced-motion still frame showing the unison note.

PUSH IT FURTHER: the three notes should feel like three voices (slight vibrato wobble that calms as they converge); the unison note "rings" with a soft sine ripple on the staff lines; optional sound on hover (a three-note slide into unison on a sampled choir "ah", only after a user gesture).

ACCEPTANCE: Crisp at any size; consistent with the other three cards; under 0.5 ms per frame.
```

---

## 8. Noir pillar card: Harmony (arpeggio into chord)

```text
ROLE: Senior SVG motion designer.

CONTEXT: [Same card system as the Blend card: an art-deco sheet-music placard in black and white, silver deco frame, faint staff, --hl accent, Josefin caps label.]

HARMONY NOW (viewBox 320×180, 4.8 s loop):
- Staff at y = 60–120 plus ledger lines at y = 135 under the low notes.
- An arpeggio of C (y 135), E (y 120), G (y 105) at x = 80, 125, 170: each note pops in (fade and rise 8px) with a 0.45 s stagger, holds, then dims to 25%.
- At about 34% a stacked chord C-E-G with one shared stem appears at x = 240 in --hl, with a strong glow that settles; three sound-wave arcs travel right from the chord (staggered 0.25 s, scale 0.8 → 1.25, fading).
- Label "C · E · G".

BUILD: <HarmonyCard /> in SVG + CSS/Motion; still frame shows the chord.

PUSH IT FURTHER: voice-leading lines that connect each arpeggio note to its place in the chord; the chord "blooms" like a shimmer of overtones (faint higher ghost notes); optional hover sound (the arpeggio then the chord, sampled piano from animation 6).

ACCEPTANCE: Musically correct notation (stems, ledger line, note-head tilt); readable at 280px wide.
```

---

## 9. Noir pillar card: Precision (metronome)

```text
ROLE: Senior SVG motion designer.

CONTEXT: [Same card system as the Blend card.]

PRECISION NOW (viewBox 320×180):
- A pyramid metronome (silver outline, faint fill) centred at x 160; the pendulum arm (paper white, with an --hl sliding weight) pivots at (160, 136) and swings ±26° with ease-in-out, 1.2 s per half-cycle, alternating.
- Four beat lights at y = 163 (x 112, 144, 176, 208) light up in sequence exactly at the swing extremes: 2.4 s cycle, a 0.6 s step, lit for the first 14% with a glow.
- Label "♩ = 100".

BUILD: <PrecisionCard /> in SVG + CSS/Motion; still frame shows the arm centred and beat 1 lit.

PUSH IT FURTHER: true physics-feeling motion (a slight ease at the extremes, the weight casting a tiny shadow), a subtle tick flash on the scale at each beat, and a hover state that speeds up to ♩ = 120 with the readout updating; optional soft woodblock click only after a user gesture.

ACCEPTANCE: The beat lights are perfectly in phase with the arm extremes, with no drift over 10 minutes (drive both from one clock).
```

---

## 10. Noir pillar card: Presence (spotlight and mic)

```text
ROLE: Senior SVG motion designer.

CONTEXT: [Same card system as the Blend card.]

PRESENCE NOW (viewBox 320×180, 5 s loop):
- A stage floor line at y 150; a vintage microphone on a stand at x 160 (capsule 14×24 at y 68, grille lines).
- A spotlight cone from the top (160, 4) to the floor (112–208), filled with a vertical gradient of --hl from 55% to 4% opacity. It sweeps from −9° to 0° and back, brightening at centre (opacity 0.55 → 1). A light pool on the floor pulses with it.
- Sound "carry" arcs on both sides of the mic: three staggered groups (0.7 s apart) scale from 0.7 to 2.2 while fading, 2.1 s loop.
- Label "SPOTLIGHT".

BUILD: <PresenceCard /> in SVG + CSS/Motion; still frame with the spot centred.

PUSH IT FURTHER: volumetric light (dust motes drifting in the beam, a soft edge falloff), a silhouette singer stepping into the light on hover, and the carry arcs reacting to the pointer like the hero waves.

ACCEPTANCE: Looks like stage light, not a flat triangle; holds 60 fps on mobile with four cards on screen.
```

---

## 11. Film grain and projector vignette

```text
ROLE: Senior front-end developer.

CONTEXT: The whole site sits under subtle 1930s film grain and a projector vignette, without affecting legibility or interactions.

NOW: a fixed, pointer-events:none overlay (z-index above content, below nav and controls). Grain is an SVG feTurbulence (fractalNoise, baseFrequency 0.85, 2 octaves) data URI tile at opacity 0.07, jittered with steps(6) translations over 0.9 s. The vignette is a radial gradient, transparent 55% → rgba(0,0,0,.55).

BUILD: a <FilmLayer intensity /> component, GPU-friendly (a composited layer, no full-page repaints), disabled for reduced motion (static grain) and on low-power devices (navigator.hardwareConcurrency ≤ 4 halves the jitter rate).

PUSH IT FURTHER: occasional (every 20–40 s) faint projector flicker (2% brightness) and a rare vertical scratch line, both extremely subtle; optional gate weave (1px drift) on the hero only.

ACCEPTANCE: No measurable impact on scroll FPS; text contrast stays AA.
```

---

## 12. Marquee ticker

```text
ROLE: Front-end motion developer.

CONTEXT: A full-width ticker between sections repeats "Blend · Harmony · Precision · Presence · Ages 13–18 · By audition", separated by a small sine-wave glyph. Items alternate: solid display type (Limelight), outlined (text-stroke) type, and every third item in neon script (Yellowtail).

NOW: two identical rows translate −100% over 38 s, linear, infinite; stopped for reduced motion.

BUILD: <Marquee items speed direction pauseOnHover /> that never shows a gap at any width (measure and duplicate as needed); scroll-velocity coupling allowed (speeds up briefly when the page scrolls fast, Motion useVelocity).

PUSH IT FURTHER: neon items flicker independently on the same random clock as animation 2; hover slows to 30%.

ACCEPTANCE: Seamless loop at 320px–2560px wide; no CLS; screen readers read the list once.
```

---

## 13. Buttons (hover fill and glass gradient)

```text
ROLE: Design-system engineer (shadcn/ui + Tailwind + CVA).

CONTEXT: The NextGen buttons are pills with uppercase tracked labels (Josefin Sans, 0.14em tracking) and an arrow that nudges 4px on hover.

NOW:
- Primary: highlight background; on hover a foreground-coloured fill rises from below (translateY 101% → 0, 520 ms, cubic-bezier(.16,1,.3,1)) and the text inverts.
- Primary finish: a subtle vertical gradient (hl mixed 78% with white → hl at 42% → hl mixed 72% with black), an inset 1px white top highlight, an inset dark bottom edge, and a soft coloured drop shadow.
- Outline: a hairline border that fills on hover.
- Labels are centred optically: text-box: trim-both cap alphabetic, plus a negative end margin equal to the letter-spacing (otherwise tracked caps sit left of centre).

BUILD: a shadcn <Button> variant set (primary, outline, ghost, link; sizes sm/md/lg) with asChild for links, the fill animation in CSS, and all colours from tokens.

PUSH IT FURTHER: a magnetic hover (the button eases 3–6px toward the pointer), a press-state squash of 0.98, a neon variant whose border is a thin glowing tube that "ignites" on hover, and a focus ring that matches the glow.

ACCEPTANCE: Label centred to ±0.5px in Chrome, Safari and Firefox (fall back gracefully where text-box isn't supported); AA contrast in every highlight colour; 44px minimum touch target.
```

---

## 14. Gallery masonry entrance and lightbox

```text
ROLE: Senior React motion engineer.

CONTEXT: The Gallery page shows photos and videos in a masonry grid with filter chips (All, Performances, Rehearsals, Behind the scenes, Video). Tapping opens a full-screen viewer.

NOW: on filter change, items re-enter with a fade-up (16px) staggered 45 ms. Captions slide up on hover (always visible on touch). Lightbox: a backdrop blur fade (300 ms), a stage zoom 0.96 → 1 (500 ms), prev/next with arrow keys and a 60px swipe threshold, Escape to close, focus moved to the close button.

BUILD: Motion layout animations: shared-element transition from the tile to the lightbox (layoutId), FLIP reflow when filtering, swipe with drag constraints and inertia, and Mux player for video items.

PUSH IT FURTHER: a subtle Ken Burns drift on still images in the lightbox; filter chips with a sliding active pill; preload neighbours.

ACCEPTANCE: The shared-element transition has no flicker; keyboard and screen-reader complete; 60 fps on mobile with 60 images.
```

---

## 15. Application form: step transitions, progress, upload and success

```text
ROLE: Senior React engineer (forms + motion).

CONTEXT: The Auditions page has a four-step application (Singer → Parent/guardian → Voice and experience → Video and consent) with video upload and a success screen.

NOW: each step slides in (opacity 0 → 1, translateX 24px → 0, 600 ms). The progress bar has four segments whose fills scale on X (700 ms; the current one at 55% opacity). The uploader has a dashed drop zone that lifts its icon on drag-over, then a file row with a thumbnail and a progress bar (simulated in the prototype; it turns green when done). The success view fades in and a tick stroke draws (stroke-dashoffset 60 → 0, 700 ms).

BUILD: react-hook-form + zod, Motion for the step transitions (direction-aware: forward slides left, back slides right), real upload progress from Mux Direct Upload (or presigned S3/R2 multipart), and error states that shake gently (2 cycles, 4px) and move focus to the first error.

PUSH IT FURTHER: a celebratory but tasteful success moment: the hero waves (animation 1) briefly swell behind the success card, and the neon "Thank you" ignites (animation 2).

ACCEPTANCE: Fully keyboard operable; announcements via aria-live; no motion with reduced motion; the upload survives a flaky connection (resumable).
```

---

## 16. Interlock logo (your supplied asset)

```text
ROLE: Senior SVG animator.

CONTEXT: This is the approved NextGen "Interlock" mark (option 02): an outlined N and G sharing a stem, drawn as a hollow line (outer edge stroke 15, inner core stroke 12 in the background colour, a 3.12 accent stroke with a metallic gradient). Animation: the outline draws in (0–27% of an 8 s cycle), a travelling highlight tracer finishes the stroke, the mark settles, then one metallic shimmer crosses it (40–72%) and it holds. Five CSS variables theme it: --ng-accent, --ng-secondary, --ng-edge, --ng-surface (must match the background behind it), --ng-shine. The site uses a deep red gradient: edge #a30f1d, secondary #5a0611, accent #ff3446, shine #ffd6da.

TASK: Keep the geometry and the draw → settle → shimmer → hold order exactly. Improve the finish:
- an optional "neon" variant where the accent line ignites like the neon signs (animation 2) after the draw;
- a mask-based (true hollow) version so it works over photos and the moving wave field (the current version needs --ng-surface to match a flat background);
- a crisp static favicon set (16, 32, 180, 512) and an animated SVG/Lottie export for social.

ACCEPTANCE: Identical silhouette; no visible seams at the shared stem; works over moving backgrounds; reduced motion shows the finished mark.
```

---

### How to use this pack

1. Pick a prompt, attach the matching folder from `nextgen-animations-code.zip`, and ask the agent to reproduce the current behaviour first, then apply the "push it further" items you want.
2. Ask for the result as a self-contained React + TS component plus a short demo page, so you can drop it straight back into the build (see `CLAUDE_CODE_BUILD_PROMPT.md`).
3. Keep the global rules (tokens, reduced motion, pause offscreen) in every request.
