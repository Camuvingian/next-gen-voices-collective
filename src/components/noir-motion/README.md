# Noir motion

Components from the NextGen Noir motion package (`media/nextgen-noir-motion.zip`, `src/noir/`), adapted for this site. The plan is in `plans/NEXTGEN_NOIR_INTEGRATION.md`.

| File | What | Used for |
| --- | --- | --- |
| `HarmonicField.tsx` | Canvas 2D waves: four voices, eased conducting, tap ripples, major/minor breathing | Hero and footer waves (via `noir/SiteWaves.tsx`) |
| `PillarCard.tsx` | The four musical scenes: blend, harmony, precision (metronome), presence (spotlight) | Home pillars (via `noir/SiteMotion.tsx`) |
| `Controls.tsx` | `Marquee` (measured, seamless ticker); also `NoirButton`, `FilmLayer` | Home ticker (via `noir/SiteMotion.tsx`) |
| `Typography.tsx` | `Shimmer`; also `NeonText`, `RiseText`, `Reveal` | The wordmark on the velvet page curtain |
| `motion.tsx` | Shared visibility / reduced-motion / frame-clock hooks | |
| `noir-motion.css` | The package CSS for the pieces above | Imported in `app/globals.css` before the site styles |

## Switches

Each new piece is the default, and the one it replaced is kept:

- **Waves:** `ENGINE` in `src/components/noir/SiteWaves.tsx`: `"noir"` (this), `"nextgen"` (the R3F waves) or `"harmonic"` (the original).
- **Scene cards and ticker:** `SCENES` and `TICKER` in `src/components/noir/SiteMotion.tsx`: `"noir"` or `"classic"`.
- **Page curtain:** chosen by the visitor under "Page curtain" in the site menu (Classic by default, or Velvet). Stored with the other menu settings (`curtain` in `ng-neon`).

## Changes from the package

- **Waves:** the package listens for the pointer on the field itself. Here the hero copy covers most of the field, so it listens on `window` and hit-tests the field's box.
- **Provider:** `NoirMotionProvider` isn't used (the site has no global pause), so the `.nm-root` CSS is rescoped: the tokens sit on `:root` and pause/reduced-motion rules key off each component's `data-run` / `data-reduced`. The site's palette (`--hl`, `--ng-glow`…) drives the colours.
- **Velvet curtain:** the package's `StageCurtain` drapes and mark, driven by the site router's existing `phase` and drawn with the site's own logo (`LogoMark`), plus a `Shimmer` NEXTGEN.
- **Lint:** refs are updated in layout effects instead of during render (React 19 rules); no behaviour change.

Not integrated yet from the package: `NeonText` (the site keeps its own neon signs), the package logo, gallery, form-step and upload motion, `NoirButton` and `FilmLayer`.
