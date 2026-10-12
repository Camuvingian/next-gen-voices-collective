# NextGen Interlock — React + TypeScript asset

Approved option 02: outlined NG draws into place, its travelling highlight finishes, the logo settles, then one metallic shimmer crosses the completed mark. Plays once and holds by default. The silhouette does not move, bounce or rotate.

## Install

Copy `NextGenLogo.tsx` and `NextGenLogo.css` into your project's components folder. Requires React 18+ and a normal CSS-capable React build (Vite, Next.js, etc.). No animation library, Three.js, canvas, external fonts or network requests are used. The TSX file imports its CSS automatically.

```tsx
import { NextGenLogo } from './components/NextGenLogo';

<NextGenLogo size={96} />
```

For frameworks that require global CSS imports in the app entry/root layout, move the CSS import from `NextGenLogo.tsx` to that entry. Keep the stylesheet unchanged.

## Match your existing theme

CSS variables inherit from any ancestor. The component does not override inherited colours unless you explicitly supply `theme` or `style`.

```css
.site-header {
  background: var(--site-background);
  --ng-accent: var(--brand-accent, #e8ff3c);
  --ng-secondary: var(--brand-highlight, #a9dfff);
  --ng-edge: #d8e9f6;
  --ng-surface: var(--site-background, #0b1524);
  --ng-shine: #ffffff;
}
```

**Set `--ng-surface` to the colour behind the logo.** This is the dark internal stroke that creates the hollow appearance; the SVG canvas itself is transparent. A moving/photo background will not show through that internal stroke.

Alternatively use props, presets or CSS colour expressions:

```tsx
import { NextGenLogo, nextGenLogoThemes } from './components/NextGenLogo';

<NextGenLogo size={180} theme={nextGenLogoThemes.ice} />
<NextGenLogo theme={{ accent: 'var(--brand)', surface: 'var(--panel)' }} />
<NextGenLogo size="clamp(64px, 10vw, 160px)" loop duration={10} />
```

Presets: `yellow`, `ice`, `amber`, `light`. The `light` preset intentionally uses stronger blue strokes for contrast on its pale-blue surface.

## Controls

| Prop | Default | Behaviour |
|---|---|---|
| `size` | `96` | Width in pixels, or any CSS width string; height scales automatically |
| `theme` | inherited CSS/default palette | Partial colour object: accent, secondary, edge, surface, shine |
| `animated` | `true` | `false` displays the finished static mark |
| `loop` | `false` | Repeat the entire sequence, including the hold |
| `duration` | `8` | Whole-cycle duration in seconds; all phases scale together |
| `delay` | `0` | Initial delay in seconds |
| `paused` | `false` | Pause/resume at the current point |
| `replayKey` | `0` | Change value to remount animated layers and restart |
| `pauseWhenHidden` | `true` | Pause when offscreen or the tab is hidden |
| `decorative` | `false` | Hide from assistive technology when surrounding content supplies the name |
| `title` | `NextGen Voice Collective` | Accessible name |
| `className`, `style` | — | Layout, integration and CSS variable overrides |

`Example.tsx` supplies working React replay, pause and theme controls. Changing colour does not restart the animation. Increment `replayKey` for a fresh one-shot; replay while `paused` remains paused, so clear `paused` at the same time if desired.

```tsx
const [replay, setReplay] = useState(0);
<NextGenLogo replayKey={replay} />
<button onClick={() => setReplay(v => v + 1)}>Replay</button>
```

## Timing at the default eight-second duration

- 0–2.7s: outlined NG resolves; travelling highlight completes.
- 2.7–3.4s: a short settle, with the full mark visible.
- 3.4–5.8s: one gentle reflection crosses the mark.
- After 5.8s: clean static hold. A loop starts the next cycle at 8s.

Geometry and percentages match the approved `preview.html`. Reduced-motion preferences always show the complete static logo. At sizes below 32px use `animated={false}` for readability. No sound is played.

## Accessibility and multiple instances

The component uses `useId()` for unique mask, gradient and title IDs, making multiple copies safe in one React root and compatible with server rendering/hydration. If your page mounts independent React roots, set a distinct React `identifierPrefix` for each root. It provides a named `role="img"` unless `decorative` is enabled. In a home link that already has an accessible label, use:

```tsx
<a href="/" aria-label="NextGen Voice Collective home">
  <NextGenLogo size={48} decorative />
</a>
```

CSS is scoped to `.ng-interlock`; there are no generic SVG/path selectors. With the stylesheet missing, the animated behaviour and layer colours are incomplete, so ship both files.

## Files and integration instruction

- `NextGenLogo.tsx`: production component and exported types/presets.
- `NextGenLogo.css`: themeable, scoped animation.
- `Example.tsx`: optional usage example, not required in production.
- `preview.html`: approved offline visual reference with native controls.

**Agent instruction:** install these two component files, replace the existing NG icon where appropriate, map the five colour variables to existing design tokens, and preserve the draw → settle → shimmer → hold order. Keep page typography/navigation unchanged. Test hero and navbar instances together, both themes, replay, pause, reduced motion and mobile sizing. Do not introduce a second animation framework.

## Verification

The package is checked with strict TypeScript and a React server-render smoke check for geometry and unique SVG references. Browser animation QA is not available in this environment; verify the timing visually in the target application's browser before release. The animation is reconstructed from the provided recording, then refined according to the approved preview.
