# NextGen Piano Rail: React + TypeScript asset

A real sampled piano that slides out along the left edge of the page. It's hidden by default and a floating glass button (bottom-left) shows and hides it. As you scroll, a chord travels down the keys; press, hold or drag across the keys to play.

`preview.html` is a self-contained working demo: open it in a browser, tap a key.

## Files

| File | What it is |
|---|---|
| `NextGenPianoRail.tsx` | The component (rail, keys, ♪ button, floating toggle) |
| `NextGenPianoRail.css` | Scoped styles (`ngp-*`), themed by CSS variables |
| `pianoEngine.ts` | Web Audio engine: `loadPiano`, `noteOn`, `noteOff`, `strike` |
| `pianoSamples.ts` | 21 acoustic-grand samples (C3–C8, every minor third) as base64 MP3. Generated file |
| `Example.tsx` | Controlled usage example |
| `preview.html` | Built offline demo |

React 18+ (built and tested on React 19). No other runtime dependencies. Import the CSS once in your app entry or root layout (`import "./NextGenPianoRail.css"`).

## Use

```tsx
import { NextGenPianoRail } from "@/components/piano-rail/NextGenPianoRail";

// Uncontrolled: hidden until the floating button is pressed; remembers the choice
<NextGenPianoRail />

// Controlled, with your own button
const [open, setOpen] = useState(false);
<NextGenPianoRail open={open} onOpenChange={setOpen} showToggle={false} />
```

Offset your layout while it's open (the component sets `data-ngp-open` on `<html>` and defines `--ngp-rail-w`):

```css
:root[data-ngp-open] body { padding-left: var(--ngp-rail-w); transition: padding-left 600ms; }
:root[data-ngp-open] .site-nav { left: var(--ngp-rail-w); }
```

## Props

| Prop | Default | Behaviour |
|---|---|---|
| `open` / `onOpenChange` | uncontrolled | Controlled open state |
| `defaultOpen` | `false` | Initial state when uncontrolled |
| `showToggle` | `true` | Render the floating bottom-left show/hide button |
| `showSoundButton` | `true` | Render the ♪ "play while scrolling" button |
| `persistKey` | `"ngp-open"` | localStorage key for open/closed; `null` disables |
| `baseMidi` | `48` (C3) | MIDI note of the bottom key; samples cover 48–108 |
| `keyHeight` | `[30, 24]` | White-key height in px: desktop, under 700px |
| `scrollTriad` | `true` | Show the moving chord as you scroll |
| `pushContent` | `true` | Set `data-ngp-open` on `<html>` while open |
| `className`, `style` | — | Extra classes; CSS variable overrides |

## Theming

Variables inherit from the host page and fall back to the NextGen Noir values:

| Variable | Default | Used for |
|---|---|---|
| `--ngp-rail-w` | `60px` (`26px` under 700px) | Rail width |
| `--ngp-accent` / `--ngp-accent-rgb` | `var(--hl)` / `var(--hl-rgb)` → neon red | Pressed-key glow, ♪ on, toggle when open |
| `--ngp-accent-fg` | `var(--hl-fg)` | Text on the accent |
| `--ngp-fg` | `var(--ng-fg)` | ♪ glyph |
| `--ngp-bed`, `--ngp-ivory*`, `--ngp-ebony` | black, ivory, ebony | Key finishes |

## How it plays

- **Keys:** standard layout (C D E F G A B with sharps between), bottom key C3, pitch falling down the page (high notes at the top). Each key's `aria-label` is its note name (for example `F♯4`).
- **Scroll chord:** `p = scrollY / (scrollHeight − innerHeight)`; lead white key (counted up from the bottom) = `round((1 − p) × (whiteCount − 6))`; the lead key and the white keys two and four above it go down, so the chord walks down the rail as you scroll.
- **Sound:** the nearest sample is re-pitched by `playbackRate = 2^((midi − root)/12)` (at most ±1 semitone), with velocity gain `v²`, a 0.09 s damper on release, and a synthesised 2.2 s hall reverb at 28% wet.
- **Audio unlock:** browsers allow sound only after a user gesture. The first key press (or the toggle) creates the audio context and decodes the samples (about 0.7 MB).
- **Reduced motion:** no glissando, float or slide transitions.

Verified: all 21 samples decode in Chromium, and each key starts the correct sample at the correct rate (C4 → sample 60 at 1.0; E4 → sample 63 at 1.0595; F♯4 → sample 66 at 1.0).

## Licence note (important)

The bundled samples were rendered from the **TimGM6mb** General MIDI soundfont (GM program 0, Acoustic Grand Piano) with FluidSynth. TimGM6mb is **GPL-2** licensed, which is fine for prototyping but not for a commercial site. Before launch, replace `pianoSamples.ts` with a properly licensed set (for example **Salamander Grand Piano**, CC-BY 3.0, credit required) rendered at the same 21 notes. The engine and component need no changes: keep the exported `PIANO_SAMPLE_NOTES` and `PIANO_SAMPLES` shapes, or switch `pianoEngine.ts` to `fetch()` MP3/OGG files lazily.
