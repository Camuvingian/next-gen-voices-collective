# NextGen Voice Collective

Website for NextGen Voice Collective, in the "Noir Club" art direction: a 1920s supper club in black and white, with one neon colour (red by default).

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
```

## Layout

| Path | What |
|---|---|
| `src/app/` | Routes: `/`, `/about`, `/auditions`, `/gallery`, `/contact` |
| `src/styles/` | `tokens.css` (every colour, font, size, motion value), `styles.css` (layout), `noir.css` (grain, neon, deco) |
| `src/app/globals.css` | Tailwind + shadcn theme, mapped 1:1 from the tokens |
| `src/components/ui/` | shadcn/ui components, re-skinned with Noir variants |
| `src/components/noir/` | Site chrome, waves, neon, pillar cards, media slots, lightbox |
| `src/components/brand/` | Interlock logo asset |
| `src/views/` | Page bodies (ported from the prototype) |
| `src/lib/content.ts` | Site copy and facts (⚑ marks placeholders) |
| `src/lib/media.ts` | Interim photo list (Instagram images in `public/media/instagram/`) |
| `reference/` | Prototype, animation sources and brand assets (read-only) |
| `plans/` | Build plan and animation spec |
