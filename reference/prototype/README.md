# NextGen Voice Collective: Noir Club website prototype

A working React + TypeScript prototype of the standalone NextGen site, in its chosen art direction, **Noir Club**: Home, About, Auditions (four-step application with video upload), Gallery and Contact (with booking fields).

Open `dist/index.html` in a browser to see it. Rebuild with `node build.mjs`.

## The look

A 1920s–30s supper club in black and white, with film grain and a projector vignette. The only colour is the deep-red logo, the red sound waves behind the hero and footer, and one neon colour for emphasised words.

- **Type:** **Limelight** (art-deco caps) for headlines, **Yellowtail** (neon script) for emphasised words, **Jost** for body text, **Josefin Sans** caps for labels and buttons. All free on Google Fonts.
- **Neon signs:** every emphasised word ("One sound.", "and", "every single week.") is a glass neon tube: a white-hot core, tinted glass, a specular streak, layered glow, and light spilling on the wall. Each sign starts unlit, ignites with a stutter once the page-load animation finishes, and holds steady. After that a visible sign flickers every 8–15 s at random (the hero sign most often). Timing: `NeonDirector.tsx`; look: `noir.css`.
- **Neon colours** (review dock, bottom-right): Neon red (default) #FF2E3F, Ruby #D1112B, White neon #F4F1EA, Blue note #4FC3FF, Neon pink #FF5FA2, Violet #B26BFF. The logo and waves stay deep red whichever you pick.
- **Sound waves:** a three.js field of four "voices" tuned to a major chord, coloured from bright red (222, 24, 44) to oxblood (128, 10, 24). They swell under the mouse.
- **Wordmark:** NEXTGEN in the nav shimmers every 8 s.
- **Buttons and colour dots:** subtle vertical gradients with a glassy top edge; labels centred optically.
- **Pillar cards:** sheet-music and stage animations: notes gliding into unison (Blend), C–E–G arpeggio into a chord (Harmony), a metronome with beat lights (Precision), a spotlight finding the mic (Presence).
- **Photos** render in black and white. Placeholders are lit by a white follow-spot and state the shot each slot needs.
- **Details:** piano-key stripes on the page curtain and the application card; double silver rules with art-deco corner fans on the pillar cards.

## Assets

| Asset | Where | Notes |
|---|---|---|
| **Interlock logo** (approved option 02) | `src/components/NextGenLogo.tsx` + `.css` | Supplied asset, used unchanged. Recoloured to a deep red gradient through its five variables (`--ng-edge` #a30f1d, `--ng-secondary` #5a0611, accent #ff3446, `--ng-shine` #ffd6da, `--ng-surface` = background). Plays in the hero and nav on load, in the footer when scrolled into view, and redraws (2.4 s cut) on the page-change curtain. |
| **Piano Rail** | `src/assets/piano-rail/` | Self-contained asset: component, scoped CSS, audio engine, samples, README, example and a working `preview.html`. Hidden by default; a floating button bottom-left shows and hides it. Real sampled piano; scroll moves a chord down the keys. See its README (including the sample-licence note). |
| **Brand files** | `brand/` | Static Interlock mark on black and on paper white, plus the horizontal lockup. |

## Project map

```
src/
  main.tsx, App.tsx              entry, shell (nav, page, footer, curtain, dock, neon director, piano rail)
  theme/tokens.css               every colour, font, size and motion token (maps 1:1 to shadcn/ui names)
  theme/styles.css               layout and components
  theme/noir.css                 grain, deco type, neon, logo colour, shimmer, buttons, pillar cards
  components/                    Logo + NextGenLogo (asset), HarmonicField (3D waves), NeonDirector,
                                 PillarCard, MediaSlot, Lightbox, Uploader, PaletteDock, Chrome (nav/footer/curtain), ui/
  assets/piano-rail/             Piano Rail asset
  pages/                         Home, About, Auditions, Gallery, Contact
  lib/                           router (hash routes + curtain), content (site copy and facts)
scripts/build-piano-preview.mjs  rebuilds the Piano Rail preview.html
docs/                            ANIMATION_PROMPTS.md, CLAUDE_CODE_BUILD_PROMPT.md (build plan)
```

The UI primitives in `components/ui/` are hand-written in the shadcn/ui pattern (forwardRef + class-variance-authority variants) because this prototype was built offline. The production build replaces them with generated shadcn/ui components themed from `tokens.css` (see the build plan, Phase 1).

## Recommended production stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Components | shadcn/ui (Radix) + Tailwind CSS v4, themed from `tokens.css` |
| Motion | Motion (motion/react) + Lenis; @react-three/fiber + drei for the waves |
| CMS | Sanity (embedded Studio) |
| Video | Mux (public video); Cloudflare R2, EU and private, for audition uploads |
| Data | Neon Postgres (EU) + Drizzle |
| Email | Resend + React Email |
| Spam / abuse | Cloudflare Turnstile + rate limiting |
| Hosting | Vercel |

The full plan is in `docs/CLAUDE_CODE_BUILD_PROMPT.md`.

## Prototype notes

- The photo and video slots are art-directed placeholders; swapping in the real assets is a one-to-one job.
- The forms validate fully but don't send anything yet. Upload progress is simulated.
- The 3D waves load three.js r128 from cdnjs. If three.js or WebGL isn't available, the same maths draws in Canvas 2D.
- The review dock (neon colour + reload) is a design-review tool; remove it before launch or keep it behind `?review=1`.

## To confirm before launch

- [ ] Contact email address (`hello@nextgenvoices.co.uk` is a placeholder) and domain
- [ ] Venue name ("Richmond & Putney Unitarian Church") and whether to show the fee on the site
- [ ] Copy for the audition process, privacy notice wording and video retention period (6 months is a placeholder)
- [ ] The fields on the current application form, mapped onto the four steps
- [ ] Real photos, the showreel cut and an Instagram access token
- [ ] Safeguarding: a policy page and named DSL contact (expected for an under-18s group)
- [ ] Photo/video consent recorded for every member shown on the site
- [ ] Licensed piano samples to replace the prototype set (see the Piano Rail README)
