# NextGen Voice Collective — Claude Code Build Pack

Part A is the prompt to paste into the lead Claude Code session; it sets up the agent team and starts Phase 0. Part B is the full plan the team works through, with owners, deliverables and acceptance criteria. Save this file in the repo as `docs/BUILD_PLAN.md` so every agent can read it.

**Inputs to put in the repo before you start**

| Put here | What |
|---|---|
| `reference/prototype/` | `nextgen-website-prototype.zip` unzipped (the working React + TS prototype: tokens, components, pages, both art directions) |
| `reference/animations/` | `nextgen-animations-code.zip` unzipped, plus `ANIMATION_PROMPTS.md` |
| `reference/logo/` | The Interlock logo asset (`NextGenLogo.tsx`, `.css`, `preview.html`) |
| `reference/brief.md` | Bradley's original brief (paste it in) |
| `reference/media/` | Professional photos and video (or a link to where they live) |

**Accounts you'll need** (the agents will ask for keys as they reach each phase): GitHub, Vercel, Sanity, Mux, Cloudflare (R2 storage + Turnstile), Resend, Neon (Postgres), Plausible, Sentry, and the domain registrar.

---

## Part A — Prompt for the lead Claude Code agent

Paste everything inside the block into Claude Code, started in an empty folder that contains `reference/`.

```text
You are the LEAD ENGINEER and orchestrator for building the production website for NextGen Voice Collective, an elite, audition-based vocal ensemble for singers aged 13–18 in London (run by Bradley, of bradleyvocalcoach.com). You coordinate a team of specialist subagents, own the architecture, review every change, and keep the plan moving. Work in small, reviewable steps; never leave the main branch broken.

## 1. Read first (do not write code until you have)
- reference/brief.md: the client brief (pages, content, form fields, branding, goals)
- reference/prototype/: a working React + TypeScript prototype. It is the visual and behavioural source of truth. Read README.md, src/theme/tokens.css, src/theme/styles.css, src/theme/jazz.css, every component in src/components and every page in src/pages.
- reference/animations/ANIMATION_PROMPTS.md: the spec for all 17 animations (timings, maths, acceptance criteria).
- reference/logo/: the approved Interlock logo asset. Use it unchanged except for colour variables.
- docs/BUILD_PLAN.md: the phased plan. Follow it in order. Tick tasks off in it as they complete.

## 2. What we're building
A standalone, fast, accessible, CMS-driven site with its own identity:
Home, About, Auditions & Applications (four-step application with video upload), Gallery, Contact (general + performance booking), plus Privacy, Safeguarding, Accessibility and 404 pages. Instagram feed. Two art directions exist in the prototype: "Noir Club" (1920s–30s black and white, deep-red logo and waves, glass neon script, optional piano rail) and "Control Room" (moody blue + hi-vis highlight). Build the token system so both work, ship NOIR as the default unless docs/DECISIONS.md says otherwise, and keep the other as a switchable theme for future campaigns. The prototype's palette dock is a review tool: keep it only behind ?review=1.

## 3. Stack (use the latest stable versions; verify each one before installing)
- Next.js 16 (App Router, React Server Components, Server Actions), React 19, TypeScript strict, pnpm
- Tailwind CSS v4 + shadcn/ui (Radix). Map the prototype's CSS custom properties 1:1 into the shadcn theme; never hard-code colours
- Motion (motion/react) for transitions, Lenis for smooth scroll, @react-three/fiber + @react-three/drei for the wave field
- next/font for Limelight, Yellowtail, Jost, Josefin Sans, Big Shoulders Display, Barlow, IBM Plex Mono (subset, swap, preload only what's above the fold)
- Sanity (embedded Studio at /studio) for all editable content, images and galleries; next-sanity with tag-based revalidation
- Mux for public video (showreel, gallery video) with @mux/mux-player-react
- Cloudflare R2 (EU jurisdiction, private bucket) for audition video uploads via presigned multipart upload. Minors' videos must never be public
- Neon Postgres (EU region) + Drizzle ORM for applications and enquiries
- Resend + React Email for notifications and confirmations
- Cloudflare Turnstile + Upstash rate limiting on every form
- Auth.js (email magic link) protecting /admin, allow-list of admin emails
- Plausible (cookieless) analytics, Sentry for errors, Vercel hosting with preview deploys
- Testing: Vitest + Testing Library, Playwright (e2e + screenshots), axe-core, Lighthouse CI. GitHub Actions CI

## 4. The team: create these subagents in .claude/agents/ (one markdown file each, YAML frontmatter with name, description and tools)
1. design-system: tokens, Tailwind/shadcn theme, fonts, UI primitives, both art directions, the /design reference page.
2. motion-3d: every animation in ANIMATION_PROMPTS.md (wave field, neon, curtain, word-rise, pillar cards, piano, grain, marquee), reduced-motion and performance.
3. pages-content: page layouts, copy, responsive layout, image handling, SEO metadata per page.
4. cms: Sanity schemas, Studio structure, GROQ queries, revalidation webhooks, content migration, editor guide.
5. forms-backend: application and contact flows, server actions, zod schemas, R2 uploads, database, emails, admin dashboard, retention jobs.
6. qa-a11y-perf: tests, accessibility audits (WCAG 2.2 AA), Lighthouse budgets, cross-browser checks, visual regression. Reviews every PR before merge.
7. security-privacy: threat model, headers/CSP, rate limits, auth, GDPR and safeguarding for under-18 data. Reviews anything touching personal data.

Give each subagent: its scope, the files it owns, the acceptance criteria from BUILD_PLAN.md, and the rule "read the prototype implementation before building". Run independent workstreams in parallel (for example design-system and cms in Phase 1); serialise anything that touches the same files.

## 5. Working agreements (put these in CLAUDE.md at the repo root)
- One branch + PR per task; conventional commits; small diffs. CI must pass (typecheck, lint, unit, e2e smoke, axe, Lighthouse) before merge.
- Server Components by default; "use client" only for interactive or animated islands. Lazy-load three.js and the piano samples; they must not be in the initial bundle.
- All colour, type, spacing and motion values come from tokens. No inline magic numbers in components.
- Every animation: respects prefers-reduced-motion, pauses offscreen, cleans up on unmount, and leaves content readable without JS.
- Every form: the same zod schema on client and server, Turnstile, rate limit, accessible errors (focus the first error, aria-live), no PII in logs or analytics.
- Personal data of minors: data minimisation, EU storage, encrypted at rest, admin-only access, signed short-lived URLs, automatic deletion after the retention period in DECISIONS.md.
- Never invent testimonials, reviews, statistics or performance history. Use clearly marked placeholders and list them in docs/CONTENT_TODO.md.
- Keep docs/BUILD_PLAN.md, docs/DECISIONS.md and docs/CONTENT_TODO.md up to date. Write an ADR in docs/adr/ for any architectural choice that differs from this prompt.
- At the end of every phase: a short report (what shipped, preview URL, open issues, decisions needed from the client).

## 6. Start now: Phase 0 only
1. Read everything in section 1. Summarise your understanding and list any contradictions or open questions in docs/DECISIONS.md (do not block on them; pick sensible defaults and mark them "default, confirm with client").
2. Scaffold the repo per the stack, with CLAUDE.md, the seven subagent files, CI workflow, env template (.env.example with every variable from BUILD_PLAN.md), Prettier/ESLint, Vitest, Playwright, and a Vercel config.
3. docs/BUILD_PLAN.md is already in the repo (Part B of the build pack). Add a checkbox to every task in it, and create docs/CONTENT_TODO.md listing every placeholder found in the prototype (search README "To confirm before launch", content.ts comments marked ⚑, and placeholder media briefs).
4. Open the first PR, report back with the plan for Phase 1 and the list of accounts and keys you need from me. Then wait for my go-ahead before Phase 1.
```

---

## Part B — Full build plan

### Architecture at a glance

```
app/
  (site)/layout.tsx            ← fonts, theme attrs, Nav, Footer, Curtain, FilmLayer, NeonDirector, PianoRail
  (site)/page.tsx              ← Home
  (site)/about/page.tsx
  (site)/auditions/page.tsx    ← info + <ApplicationForm/>
  (site)/gallery/page.tsx
  (site)/contact/page.tsx
  (site)/privacy | safeguarding | accessibility/page.tsx
  (site)/template.tsx          ← curtain page transition (Motion)
  admin/(protected)/…          ← applications & enquiries dashboard (Auth.js)
  studio/[[...tool]]/page.tsx  ← Sanity Studio
  api/upload/route.ts          ← R2 presigned multipart (init/part/complete)
  api/revalidate/route.ts      ← Sanity webhook → revalidateTag
  api/cron/retention/route.ts  ← nightly deletion job (Vercel Cron)
components/ui/*                ← shadcn primitives themed by tokens
components/motion/*            ← HarmonicField, NeonText, RiseText, Reveal, Curtain, Marquee, FilmLayer, PianoRail, pillar cards
components/brand/*             ← NextGenLogo (asset), Logo lockups
lib/schemas/*                  ← zod schemas shared by client + server
lib/db/*                       ← Drizzle schema + queries
lib/sanity/*                   ← client, GROQ, types (generated with sanity typegen)
emails/*                       ← React Email templates
styles/tokens.css              ← ported from prototype (both art directions)
```

### Environment variables (.env.example)

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_REVALIDATE_SECRET=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=nextgen-auditions
DATABASE_URL=
RESEND_API_KEY=
EMAIL_FROM=
APPLICATIONS_INBOX=
ENQUIRIES_INBOX=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
AUTH_SECRET=
AUTH_RESEND_KEY=
ADMIN_EMAILS=
INSTAGRAM_FEED_URL=            # Behold.so feed JSON, or Graph API token below
INSTAGRAM_ACCESS_TOKEN=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
SENTRY_DSN=
CRON_SECRET=
```

### Phase 0 — Kickoff and foundations
**Owner:** lead · **Parallel:** none

| Task | Deliverable |
|---|---|
| Read the inputs; write DECISIONS.md and CONTENT_TODO.md | Docs committed |
| Scaffold Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn init | Repo builds |
| CLAUDE.md, .claude/agents/*.md (7 agents) | Team configured |
| CI: typecheck, lint, Vitest, Playwright smoke, axe, Lighthouse CI | Green pipeline on PR |
| Vercel project linked; preview deploys per PR | Preview URL |
| .env.example; secrets documented | Env template |

**Done when:** an empty "Hello NextGen" page deploys to a preview URL from a PR with CI green.

### Phase 1 — Design system and tokens
**Owner:** design-system · **Parallel with:** Phase 5 schema design (cms)

| Task | Deliverable |
|---|---|
| Port `tokens.css` (both art directions, all highlight colours, neon variables, logo variables) | `styles/tokens.css` |
| Map tokens into the Tailwind v4 theme and shadcn CSS variables | Theme config |
| Fonts via next/font (seven families, subset, display swap) | `app/fonts.ts` |
| Primitives: Button (primary/outline/ghost/link, glass gradient in Noir, centred labels), Input, Textarea, Select, Choice (radio cards), Chips, Checkbox, Field (label/hint/error), Eyebrow, Badge, Dialog, Tabs | `components/ui/*` |
| Theme switching via `data-ng-style`, `data-ng-theme`, `data-ng-hl` on `<html>`, set server-side (no flash); review dock behind ?review=1 | ThemeProvider |
| `/design` page showing every token, type style and component in both styles | Living style guide |

**Done when:** `/design` matches the prototype visually in both styles; axe is clean; button labels are centred to ±0.5px; contrast AA in every highlight colour.

### Phase 2 — Layout shell and motion foundation
**Owner:** motion-3d (+ design-system for Nav/Footer markup)

| Task | Deliverable |
|---|---|
| Nav (scroll blur, active link underline, mobile full-screen menu with clip-path reveal), Footer (CTA band + columns) | Shell components |
| Curtain page transition in `template.tsx` (animation 4) with logo redraw | Route transitions |
| Lenis smooth scroll (disabled for reduced motion) | Provider |
| RiseText and Reveal (animation 5), SSR-safe | Motion primitives |
| FilmLayer grain and vignette (animation 12) | Noir overlay |
| NeonText + NeonDirector (animation 2) | Neon system |
| Wordmark shimmer (animation 3); Interlock logo integration (animation 17) | Brand motion |
| Marquee (animation 13) | Ticker |

**Done when:** the shell is navigable on desktop and mobile; transitions have no flash and CLS 0; reduced-motion mode is complete; the neon ignites and then flickers every 8–15 s.

### Phase 3 — Pages (static content first)
**Owner:** pages-content

| Page | Sections |
|---|---|
| Home | Hero (logo, kicker, "Young voices. One sound." with neon, lede, two CTAs, facts strip), statement + media, showreel, four pillars, marquee, photo mosaic, auditions teaser with steps, Instagram strip, footer CTA |
| About | Page header, panoramic image, who it's for (criteria), inside a rehearsal (session flow), performance, what singers gain, ensemble principle, key facts (ages, rehearsals, venue, fees) |
| Auditions | Eligibility, what happens after you apply, filming tips, application form (Phase 6 wires it up), questions aside |
| Gallery | Filter chips, masonry, lightbox (animation 15) |
| Contact | Enquiry type cards, conditional booking fields, details aside (email with copy button, rehearsals, Instagram) |
| Legal | Privacy notice, Safeguarding policy + DSL contact, Accessibility statement, 404 |

Content starts from the prototype's `content.ts`; every placeholder goes in CONTENT_TODO.md.

**Done when:** every page matches the prototype at 390, 768, 1280 and 1440px; Lighthouse mobile ≥ 90 for Performance, Accessibility, Best Practices and SEO on every page.

### Phase 4 — Signature animations
**Owner:** motion-3d · use ANIMATION_PROMPTS.md items 1, 6–11, 14 (each with its acceptance criteria)

| Task | Notes |
|---|---|
| HarmonicField in R3F (animation 1), lazy-loaded, Canvas 2D fallback | Hero + footer |
| Pillar cards: Noir SVG set (7–10) and Control scopes (11) | Swap by style |
| Piano rail (6): replace GPL samples with a licensed set (e.g. Salamander Grand, CC-BY; credit on the Accessibility/credits page), lazy-load on open, iOS audio unlock | Hidden by default, floating toggle |
| Button magnetic hover and neon variant (14) | Optional polish |

**Done when:** the initial JS bundle (excluding three.js and audio) is under 200 KB gzip; the hero reaches LCP < 2.5 s on a throttled mobile profile; all animations pass their prompt's acceptance criteria.

### Phase 5 — CMS (Sanity)
**Owner:** cms

**Schemas**

| Document | Fields |
|---|---|
| `siteSettings` | site name, tagline, contact email, Instagram handle/URL, default style (noir/control), default highlight, SEO defaults, social image |
| `auditionSettings` | applications open (bool), next audition date(s), closing date, term dates, fee + term length, eligibility list, filming tips, retention period (months), confirmation email copy |
| `rehearsal` | day, time, venue name, address, map link, visiting policy |
| `page` (home/about/auditions/gallery/contact) | portable-text sections: hero, statement, pillars, steps, facts, CTA, FAQ |
| `galleryItem` | title, category (Performances/Rehearsals/Behind the scenes), image (with hotspot) or Mux video, date, alt text (required), **photo consent on file** (required true to publish), featured |
| `performance` | title, date, venue, description, image, link (feeds an optional events list and Event JSON-LD) |
| `faq` | question, answer, category |
| `person` (optional) | name, role, bio, photo (directors/accompanists only; never singers' personal details) |

| Task | Deliverable |
|---|---|
| Studio at /studio with a structured desk (Settings, Pages, Gallery, Performances, FAQs) | Editor UI |
| GROQ queries + generated types; tag-based caching; webhook → `/api/revalidate` | Live updates in seconds |
| Image pipeline via next/image + Sanity CDN; Mux plugin for video | Media |
| Migrate content from the prototype and the Wix site; upload brand media | Populated dataset |
| Editor guide (`docs/EDITOR_GUIDE.md`) + 10-minute Loom script for Bradley | Handover |

**Done when:** Bradley can change hero copy, open/close auditions, add a gallery photo, and see it live within 60 seconds, without a developer.

### Phase 6 — Forms, uploads, database, email, admin
**Owner:** forms-backend · **Reviewer:** security-privacy

**Application flow**
1. Steps: Singer (first/last name, date of birth with an age 13–18 check, school year, optional singer email) → Parent/guardian (name, relationship, email, phone) → Voice and experience (voice type, styles, experience, why NextGen, Saturday availability) → Video and consent (upload or link, song and artist, how did you hear, guardian consent, privacy acknowledgement). Confirm field list against the current Wix form (CONTENT_TODO).
2. Upload: browser → `/api/upload` (init) → presigned multipart PUTs to R2 (private, EU) → complete; resumable, with progress; type/size checks (video/*, ≤ 500 MB); server re-validates.
3. Submit via a Server Action: zod validation, Turnstile verification, rate limit, insert into Postgres (`applications`), attach the R2 object key, send a confirmation to the guardian and a notification to APPLICATIONS_INBOX (no video attached; link to admin).
4. Success screen with next steps.

**Contact flow:** enquiry type (general/booking/auditions/press); booking adds event date, location, type, audience size; stored in `enquiries`; email to ENQUIRIES_INBOX plus an auto-reply.

**Database (Drizzle)**

```
applications(id, created_at, status[new|shortlisted|invited|offered|declined|withdrawn],
  singer_first, singer_last, dob, school_year, singer_email?,
  guardian_name, guardian_relation, guardian_email, guardian_phone,
  voice_type, styles[], experience, why, available,
  video_key?, video_link?, song, heard_from?, consent_at, privacy_ack_at,
  notes, delete_after)
enquiries(id, created_at, kind, name, email, phone?, message,
  event_date?, location?, event_type?, audience?, status, delete_after)
audit_log(id, at, actor, action, entity, entity_id)
```

**Admin (/admin, Auth.js magic link, ADMIN_EMAILS allow-list):** list/filter applications, view details, stream video via a 10-minute signed URL, change status, add notes, export CSV, delete on request (right to erasure). Every view and delete is written to the audit log.

**Retention:** nightly Vercel Cron → `/api/cron/retention` deletes applications, videos and enquiries past `delete_after` (the default comes from `auditionSettings.retentionMonths`).

**Done when:** e2e tests cover the happy path, validation errors, a 400 MB upload with a simulated network drop and resume, Turnstile failure, and a rate-limit hit; the security-privacy review is signed off; no PII appears in logs, Sentry or analytics.

### Phase 7 — Media, video and Instagram
**Owner:** pages-content + cms

| Task | Deliverable |
|---|---|
| Showreel and gallery video via Mux Player (poster, captions track, lazy) | Video |
| Gallery from Sanity with filters, layout animations and lightbox (animation 15) | Gallery |
| Instagram strip: Behold.so feed (or Graph API with token refresh), cached and revalidated hourly, graceful fallback to static tiles | IG feed |

**Done when:** the gallery handles 100+ items smoothly; videos only load on interaction; the IG feed never breaks the page.

### Phase 8 — SEO, analytics and legal
**Owner:** pages-content + security-privacy

| Task | Deliverable |
|---|---|
| Metadata per page; OG images via next/og (styled per art direction) | Social previews |
| JSON-LD: Organization + MusicGroup, Event for performances, FAQPage | Rich results |
| sitemap.xml, robots.txt, canonical URLs; redirect `bradleyvocalcoach.com/nextgen` to the new domain (on the Wix side) | Indexing |
| Plausible (cookieless) with goals: application started/submitted, booking enquiry sent | Analytics without a cookie banner |
| Privacy notice, Safeguarding policy, Accessibility statement, credits (fonts, samples licence) | Legal pages |

### Phase 9 — QA and hardening
**Owner:** qa-a11y-perf + security-privacy

- Accessibility: WCAG 2.2 AA (keyboard, focus order, screen reader pass with VoiceOver and NVDA, reduced motion, 200% zoom, colour contrast in every theme and highlight).
- Performance budgets: LCP < 2.5 s, INP < 200 ms, CLS < 0.05 on mobile; Lighthouse ≥ 90 for all categories on every page.
- Cross-browser: Safari iOS 17+, Chrome Android, desktop Safari/Chrome/Firefox/Edge.
- Security: CSP and security headers, Turnstile, rate limits, upload validation, auth hardening, dependency audit, secrets scan.
- Visual regression: Playwright screenshots of every page in both styles at four widths.
- Content: every CONTENT_TODO item resolved or explicitly signed off.

### Phase 10 — Launch and handover
**Owner:** lead

| Task | Deliverable |
|---|---|
| Domain + DNS on Vercel, HTTPS, www redirect; email sending domain verified (SPF, DKIM, DMARC) in Resend | Live site |
| Production env vars; Sentry alerts; uptime monitor | Monitoring |
| Final content load; switch auditions open | Go-live |
| Handover: README, EDITOR_GUIDE.md, admin guide, runbook (rotating keys, restoring backups, deleting data on request) | Docs |
| 2-week hypercare: fix list, analytics review | Stabilise |

### Post-launch roadmap (optional)
Events/performances page with ticket links, alumni and testimonials (real, consented), a members' area (rehearsal notes, part-learning tracks), a newsletter, and a press kit page.

### Decisions needed from Bradley (seed DECISIONS.md)

| Decision | Default until confirmed |
|---|---|
| Which art direction ships (Noir or Control Room) | Noir |
| Domain name and sender email | placeholder `nextgenvoices.co.uk` |
| Show the fee publicly? | Yes (£275 per 12-week term, varies with term length) |
| Audition video retention period | 6 months |
| Who receives applications and enquiries | Bradley's email |
| Venue name as it should appear | Richmond & Putney Unitarian Church (confirm) |
| Photo/video consent process for members (needed before any member image is published) | No member image published without consent recorded in the CMS |
| Designated Safeguarding Lead name and contact | Required before launch |
| Piano rail on the live site? | Yes, hidden by default |
| Instagram feed method | Behold.so |

### Risks and how the plan handles them

| Risk | Mitigation |
|---|---|
| Under-18s' personal data and videos | EU storage, private bucket, signed URLs, admin-only access, retention job, audit log, security review gate |
| Heavy visuals hurting mobile performance | Lazy three.js and audio, budgets enforced in CI, Canvas fallback, reduced-motion paths |
| Spam on forms | Turnstile + rate limiting + server validation |
| Sample/font licensing | Licensed piano samples, Google Fonts (OFL), credits page |
| Content not ready at launch | CONTENT_TODO tracked from day one; placeholders clearly marked; CMS lets Bradley finish copy himself |
```
