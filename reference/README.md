# NextGen Voice Collective: reference pack (Noir Club)

Everything needed to build the production site. Unzip, rename this folder to `reference/` inside the new repo, add `brief.md` (the client brief) and `media/` (photos and video), then follow `docs/BUILD_PLAN.md`.

| Folder | What |
|---|---|
| `prototype/` | The working React + TypeScript mock-up. Open `prototype/dist/index.html` in a browser. Source in `prototype/src`, rebuild with `node build.mjs` (needs React 19, react-dom, esbuild, zod, class-variance-authority). |
| `assets/logo/` | The approved Interlock logo asset (as supplied: component, CSS, example, README, preview). |
| `assets/piano-rail/` | The Piano Rail asset: component, scoped CSS, audio engine, samples, example, README, and a working `preview.html`. |
| `brand/` | Static SVGs: Interlock mark on black, on paper white, and the horizontal lockup. |
| `animations/` | Source code for each animation, in folders numbered to match `ANIMATION_PROMPTS.md`. |
| `docs/BUILD_PLAN.md` | The Claude Code team prompt (Part A) and the full phased build plan (Part B). |
| `docs/ANIMATION_PROMPTS.md` | One copy-paste prompt per animation, for Astra or any coding agent. |

Licence notes: fonts are Google Fonts (SIL OFL). The prototype piano samples come from the GPL-2 TimGM6mb soundfont: replace them before launch (see `assets/piano-rail/README.md`).
