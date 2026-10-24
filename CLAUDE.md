@AGENTS.md

# NextGen Voice Collective

Live at https://www.nextgenvoices.live (Vercel). The site of a youth choir for singers aged 13–18, founded by Bradley Barton-Young. Its "Noir Club" look is a 1920s supper club in black and white with one neon colour.

Stack: Next 16.4 App Router (with `cacheComponents`), React 19.3, TypeScript, Tailwind v4, shadcn/ui, zod 4, `@vercel/blob`, and Resend through its REST API. The package manager is pnpm 11.

## Commands

```bash
pnpm dev          # next dev
pnpm lint         # eslint
pnpm test         # vitest
pnpm test:e2e     # builds the waves preview, then runs Playwright
pnpm build
```

- Never run `pnpm build` while `next dev` is running; they share `.next/`.
- If dev serves a stale module (for example "X is undefined" after an export was added), stop it, `rm -rf .next/dev`, then restart.
- Port 3000 is often in use by another session. Run dev on a different port (for example `pnpm dev -p 3001`) rather than killing what is on 3000.
- The one existing lint warning (`no-unused-expressions` in `src/views/Auditions.tsx`) is older than this file. Don't add new ones.

## Git workflow

- Work on the feature branch `feat/noir-club-foundation`. Vercel deploys `main`.
- To merge, don't check out `main`: switching branches leaves `next dev` serving stale CSS. Instead run:
  ```bash
  git push origin feat/noir-club-foundation:main
  git branch -f main origin/main
  ```
- Commit messages use conventional prefixes (`feat(founder): …`, `feat(forms): …`) and end with the Co-Authored-By line.
- Never commit these untracked files: `media/nextgen-noir-motion.zip` and `media/neon-bolt-preview.html`.

## Secrets

- `keys/` and `.env.local` are git-ignored. Never commit them or print their values.
- `.env.example` is committed and lists every variable:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`, which is `applications@nextgenvoices.live`
  - `AUDITIONS_TO` and `CONTACT_TO`, which default to `bradley@bradleyvocalcoach.com`
  - `SITE_URL`
  - `BLOB_STORE_ID`
  - `CRON_SECRET`
  - `VIDEO_LINK_SECRET`, which is optional and falls back to `CRON_SECRET`
- Production values are set in Vercel. The Blob store authenticates with OIDC there, so there is no `BLOB_READ_WRITE_TOKEN`.
- Ask before sending any email to a real inbox, including test sends.

## Layout

| Path | What it holds |
|---|---|
| `src/app/` | Thin route files for `/`, `/about`, `/founder`, `/auditions`, `/gallery` and `/contact`. Each one calls `pageMeta()` and renders a view. |
| `src/views/` | Page bodies (`Home`, `About`, `Founder`, `Auditions`, `Contact`, `Gallery`) |
| `src/lib/content.ts` | All site copy (`FOUNDER`, steps, facts). ⚑ marks placeholders. Edit copy here, not in the views. |
| `src/lib/media.ts` | Photo lists (`FOUNDER_PHOTOS`, `FOUNDER_CREDITS`, …) with their sizes. The files are in `public/media/`. |
| `src/lib/router.tsx` | `ROUTES` and `ROUTE_LABELS`, which drive the top menu, plus the page-change curtain. Add a page here as well as in `src/app/`. |
| `src/lib/seo.ts` | `SITE_URL` and `pageMeta(title, description, path, { ownImage })` |
| `src/lib/forms.ts` | zod schemas shared by the browser and the API routes (audition steps, contact, video rules, `HONEYPOT`) |
| `src/lib/server/` | Server-only code: `email.ts` (Resend), `auditionEmails.ts` (receipt and team emails, CSV), `videoLink.ts` (HMAC links), `rateLimit.ts`, `blob.ts` |
| `src/app/api/` | `apply`, `contact`, `audition-video` (upload tokens), `video` (signed playback redirect), `cron/purge-videos` |
| `src/styles/` | `tokens.css` holds every colour, font, size and motion value. `noir.css` holds most component styles, with an `ng-` prefix. `styles.css` holds layout. |
| `src/components/neon/` | Neon menu and settings (`NeonProvider`), `NeonSign`, and `neonBoot.ts`, which runs before first paint |
| `src/components/noir/` | Site chrome, `SiteWaves`, `Uploader`, `CreditsRibbon`, `MediaSlot`, `primitives` |
| `src/components/noir-motion/` | The live Canvas2D wave field (`HarmonicField.tsx`) and `Marquee` (in `Controls.tsx`). The three.js `noir/HarmonicField.tsx` is the older alternative. |
| `src/components/piano-rail/` | Piano Scroll rail. `pianoEngine.ts` fires `ng:note` and `ng:note-off` window events, which make the waves ripple. |
| `reference/`, `plans/` | Prototype, brand assets and build specs. They are read-only. |

## Conventions

- **Comments:** short and plain-English, explaining why rather than what. Match the density of the code around them. Doc comments sit on the exported component.
- **Settings:** defaults live in `NEON_DEFAULTS` (`NeonProvider.tsx`): red, Deco lettering, Piano Scroll on, Velvet curtain.
  - `neonBoot.ts` duplicates those defaults on purpose, because it is serialised with `toString()` into an inline script and can't import anything.
  - Change both files together.
- **Theme colour:**
  - The highlight colour is `var(--hl)`, with its family `--hl-2`, `--hl-rgb` and `--ng-glow`.
  - Presets are set with `data-ng-hl` on `<html>`, using `ruby|white|blue|pink|violet`; red has no attribute.
  - Never hard-code the neon colour.
- **Motion:** every animation needs a `prefers-reduced-motion` fallback. Hover-only effects go inside `@media (hover: hover)`.
- **Client components:** `dynamic(..., { ssr: false })` is only allowed in Client Components.
- **Forms:**
  - Validation rules live once, in `forms.ts`. The browser checks each step and the server checks everything again.
  - Both forms have a honeypot field (`website`) and a per-IP rate limit, which is in memory and resets on each instance.
- **Audition videos:**
  - They are private blobs at `auditions/<uuid>/<name>`, uploaded straight from the browser with a presigned token.
  - Emails link to `/api/video` with an HMAC signature valid for 14 days. That route redirects to a presigned URL that lasts one hour.
  - A daily Vercel Cron job (`vercel.json`) deletes videos older than 13 days. The privacy notice promises at most `VIDEO_KEEP_DAYS` (14).
- **Emails:**
  - Emails use inline-styled tables (no external CSS).
  - The header image is attached inline (`cid:nextgen-sign`) so it shows before deploy and in clients that block images.
  - The team CSV has a UTF-8 BOM, CRLF line endings, every cell quoted, and a guard against formula injection.
- **Link previews:**
  - The `opengraph-image.jpg` and `.alt.txt` files are 1200×630 and under 100 KB.
  - If a page sets `openGraph`, it replaces the parent's whole object, so `pageMeta` adds the site image back.
  - A page with its own image file (for example `/founder`) passes `{ ownImage: true }`, which leaves out the `images` key entirely.
- **Copy:**
  - Write in British English.
  - Bradley's biography comes from bradleyvocalcoach.com/about; LinkedIn blocks scraping.
