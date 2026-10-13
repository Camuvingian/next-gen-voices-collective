# Claude: implement the NextGen Noir animation package in my website

You have access to my existing website repository and the extracted `nextgen-noir-motion/` package supplied alongside this prompt. Implement the animations in the real application. Do not stop at a plan, produce a replacement website, or recreate the animations from descriptions: integrate and adapt the supplied working React/TypeScript source.

If this is Claude Code, work directly in the repository. If you only have chat access and cannot read or edit it, ask me for repository/file access before claiming implementation.

## Desired result

Apply the Noir Club animation system shown in the package previews to my existing site: 1920s–30s Art Deco, black lacquer, engraved silver, ivory type, deep-red voice ribbons, realistic-looking glass neon, velvet curtains and restrained musical movement. The logo is the approved interlocking N/G: keep its exact silhouette and draw → settle → shimmer → hold sequence.

Preserve my content, navigation, responsive layout, working forms, uploads, media integrations and theme selector. Adapt animations to the existing component structure rather than replacing the app with the showroom. Retain other site themes if present; scope Noir-only styling to the Noir theme.

## Package and entry points

Locate the folder containing `README.md`, `package.json`, `src/noir/` and `dist/`. Its name may differ if the archive has been renamed.

- `src/noir/index.ts`: public component exports.
- `src/noir/`: actual production-oriented component source, shared hooks, audio engine and CSS.
- `dist/nextgen-noir-preview.html`: full interactive showroom; works offline in a browser.
- `dist/nextgen-noir-compact-preview.html`: the compact, tabbed preview shown in the conversation.
- `src/demo/`: preview composition only; use it as reference, not production business logic.
- `README.md`: component APIs, token mapping and scope limits.
- `INTEGRATION_PROMPT.md`: supplementary integration reference.
- `VALIDATION.md`: checks already performed and the remaining integration checks.
- `fonts/` and `licenses/`: optional self-hosted fonts and required notices.

The demo package uses React 19.2 and strict TypeScript. Keep the website's installed React version and framework. If it differs, adapt ref/types or browser attributes as needed; do not force a framework upgrade just to use the animations. React is the only animation runtime dependency.

## Working procedure

1. Read the repository's `AGENTS.md`, `CLAUDE.md` and relevant project instructions. Inspect git status and preserve unrelated work.
2. Find the actual app entry/root layout, router, theme tokens, hero, navigation wordmark, logo, musical cards, piano rail, gallery and application form. Resolve components by name and behaviour; numbering in the old prompt pack is not authoritative.
3. Read the package README and open both previews. Make a concise implementation map, then proceed with the edits.
4. Copy the reusable `src/noir/` files into a suitable directory in the app, preserving or updating internal imports. Add one `NoirMotionProvider` around the appropriate client subtree.
5. Import the CSS once, with defaults before existing site/theme overrides. Remove conflicting old motion rules only for the components being replaced.
6. Integrate the visual components first, then connect router, piano, gallery and form adapters to the application's real state.
7. Run the project's type check/build and relevant tests. Inspect the actual integrated pages in a browser, including mobile and reduced motion. Fix regressions before finishing.
8. Report the changed files, implemented behaviour, checks run and any concrete remaining limitations. Do not publish or deploy unless I separately request it.

## Integration map

| Website feature | Supplied implementation | Required adaptation |
|---|---|---|
| Hero/footer waves | `HarmonicField.tsx` | Keep a bounded parent height and correct stacking; allow exposed wave areas to receive pointer/tap events |
| Neon words/signs | `NeonText` in `Typography.tsx` | Wrap real strings; remove the old NeonDirector/class flicker on migrated elements |
| Navigation wordmark | `Shimmer` | Preserve the existing font, label and navigation link |
| Headline entrance | `RiseText` | Delays/staggers are milliseconds; avoid nesting masked words inside neon text |
| Section entrances | `Reveal` | Keep content initially visible without JS; do not double-wrap existing reveal animations |
| Blend/Harmony/Precision/Presence | `PillarCard` or named card exports | Preserve surrounding copy; `kind` is `blend`, `harmony`, `precision` or `presence`; optional `bpm` |
| Approved interlock logo | `NextGenLogo.tsx` + `logo.css` | Use exact supplied geometry and the genuine hollow SVG mask; preserve size/title/decorative semantics |
| Page transitions | `StageCurtain`, `useStageTransition` | Build the correct adapter for the actual router; wait for destination content to mount |
| Film texture | `FilmLayer` | Use a locally bounded decorative overlay; avoid duplicate full-page grain |
| Ticker | `Marquee` | Preserve accessible text; measured repetition provides the continuous loop |
| Buttons | `NoirButton` / `.nm-button` | Keep real links as anchors; adapt the look to the site's existing Button/asChild API if appropriate |
| Piano rail | `NextGenPianoRail` | Keep opt-in sound, state control and sensible content offset; one rail per document |
| Photo gallery | `NoirGallery` | Use directly for images, or port its motion/dialog treatment while retaining existing video/Mux behaviour |
| Form stages | `StepPanel`, `StepProgress` | Drive with real form state and validation; focus the next section/error appropriately |
| Upload status | `UploadProgress` | Drive only from actual upload progress/status/error callbacks |
| Submission success | `SuccessMoment` | Render only after confirmed application success |

## Styling and colour

Load the files in this general order, adjusting paths for the repository:

```tsx
import './noir/tokens.css';
import './theme/tokens.css'; // existing app tokens, if present
import './theme/jazz.css';   // existing Noir theme, if present
import './noir/logo.css';
import './noir/noir.css';
```

Do not copy `src/demo/demo.css` wholesale into the site. Its global body rules, showroom sections and controls are not application styling.

Reuse the existing palette system. Set `--hl` and `--hl-rgb` together:

```css
:root[data-ng-hl="jz-blue"] {
  --hl: #69cfff;
  --hl-rgb: 105, 207, 255;
}
```

The neon, musical accents, buttons and piano consume these values. By default the wave field and logo stay brand-red independently:

```css
--ng-glow: 222, 24, 44;
--ng-glow-2: 128, 10, 24;
--ng-edge: #a30f1d;
--ng-secondary: #5a0611;
--ng-accent: #ff3446;
--ng-shine: #ffd6da;
```

The field re-reads colours on relevant ancestor attribute/style changes, including when paused. The logo no longer requires a flat background colour to imitate hollow lines. Keep the existing Limelight, Yellowtail and Jost fonts, or self-host the supplied fonts with their license notices. Preserve theme variants and avoid CSS variable collisions.

## Router integration: do this correctly

Keep `StageCurtain` mounted above page boundaries. Use its transition callback to commit navigation after cover, and resolve only after destination content has mounted. Do not assume that `await router.push(...)` waits for Next.js App Router navigation; it returns void. Resolve a pending navigation from a pathname/content-ready effect or the actual router's completion API.

```tsx
const transition = useStageTransition();
await transition(
  () => navigateAndWaitForMountedContent(destination),
  () => document.querySelector<HTMLElement>('main h1'),
);
```

`navigateAndWaitForMountedContent` above is a contract to implement in this repository, not a function exported by the package. Preserve prefetching, modified-click/new-tab behaviour, hash links, scroll restoration and back/forward. Handle rejection/cancellation so the curtain always clears and the UI remains usable. Do not let pending navigation promises hang indefinitely. Move focus to the destination heading after reveal, and bypass decorative delay under reduced motion.

## Piano and audio

The package contains an original synthesised electric-piano-like sound, not sampled acoustic grand recordings. There are no GPL soundfonts or audio downloads. Preserve this distinction. The public rail supports `open`, `defaultOpen`, `onOpenChange`, `showToggle`, `showSoundButton`, `persistKey`, `baseMidi`, `keyHeight`, `scrollTriad` and `pushContent`.

- Create/unlock audio only through a user gesture; start muted.
- Keep pointer play/drag, keyboard operation and release on blur, hidden tab, close and unmount.
- Use a C note for `baseMidi` to preserve key naming and black-key placement.
- Avoid global keyboard shortcuts stealing keys from inputs or textareas.
- Ensure the rail/toggle does not cover core site controls at mobile widths.
- If a real grand-piano sample engine is already present and properly licensed, you may retain it behind the new visual rail. Do not silently reintroduce the soundfont flagged in the original brief.

## Forms and media

Keep the existing validation library, data contracts, consent processing and upload transport. `UploadProgress` is a controlled display; it is not an uploader. The demo slider is not production functionality. Do not show a completed upload or thank-you merely because a timer expired.

`NoirGallery` is image-only. Preserve existing video playback, captions, media permissions and content fetching. Avoid replacing the site's real imagery with the demo's vector stage illustrations. Keep Escape, arrow keys, swipe, focus trapping/restoration and meaningful alt text.

## Constraints and honest scope

- The wave implementation is Canvas2D with perspective-style ribbons; it is not an R3F/WebGL scene. Keep the original shader renderer only if the website explicitly depends on it and port the visual interaction separately.
- No redesign of the logo silhouette and no added musical symbols inside it.
- No rapid strobes, autoplay audio, fake submissions or gratuitous motion.
- Do not add a new animation framework just to wrap the supplied CSS/SVG/Canvas code.
- Components should pause offscreen/when hidden, respect the OS reduced-motion setting and clean up observers, timers, RAF and audio resources.
- The package does not include a backend, Mux uploader, Web MIDI, sampled grand, Lottie export or FLIP/shared-element gallery. Do not claim those are implemented unless you separately implement and verify them in the actual repository.

## Acceptance checks

1. Build/type check passes in the actual repository; no new console errors.
2. Check 320px, 390px, tablet and desktop widths; no horizontal overflow or obscured controls.
3. Compare integrated hero, neon, cards and logo against the supplied previews.
4. Change palette during motion and while paused; the expected elements update without reloading.
5. Verify the logo draws then shimmers and renders correctly over moving backgrounds.
6. Test reduced motion at load and after changing the OS preference; content remains readable and scenes finish in attractive static states.
7. Test route links, hashes, back/forward, rapid clicks and navigation failure; no stuck curtain, wrong focus or old-page flash.
8. Test keyboard focus, button/link semantics, gallery close/restore and form error focus.
9. Test sound opt-in, piano drag/release, typing in forms and closing/unmounting the rail.
10. Exercise the real form/upload success and error paths. Do not report performance or audio latency numbers without measuring on relevant hardware.

Implement the integration now. Make routine implementation decisions from the repository and this package; ask only when a missing fact materially blocks correct implementation.
