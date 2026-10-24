"use client";

import { useState } from "react";
import { MediaSlot } from "@/components/noir/MediaSlot";
import { SiteMarquee, SitePillarCard } from "@/components/noir/SiteMotion";
import { Lightbox } from "@/components/noir/Lightbox";
import { InstagramGlyph } from "@/components/noir/Chrome";
import { Arrow, ButtonLink, Eyebrow, Reveal } from "@/components/noir/primitives";
import { GALLERY, PILLARS, SITE, STEPS } from "@/lib/content";
import { Link } from "@/lib/router";
import { PHOTOS, SITE_PHOTOS } from "@/lib/media";
import { NeonSign } from "@/components/neon/NeonSign";
import { HomeHero } from "./HomeHero";

// no showreel has been cut yet: "See the standard" plays the rehearsal film from the gallery
const SHOWREEL = GALLERY.filter((g) => g.film);

export function Home() {
  const [reel, setReel] = useState<number | null>(null);

  return (
    <>
      <HomeHero />

      {/* ── Statement ───────────────────────────── */}
      <section className="ng-section ng-wrap ng-statement">
        <Reveal className="ng-statement-text">
          <Eyebrow>The Collective</Eyebrow>
          <p className="ng-display ng-statement-big">
            The next generation of singers, selected for their voice <NeonSign>and</NeonSign> their discipline, working together until the blend is effortless.
          </p>
          <div className="ng-statement-cols">
            <p>
              NextGen brings ambitious performers aged 13 to 18 into intensive ensemble and choir-based rehearsal. The focus is excellence: vocal
              blend, harmony, and artistic development.
            </p>
            <p>
              Singers build advanced musicianship, healthy technique and real stage presence, and learn to serve a collective sound without losing
              the individual identity that makes them stand out.
            </p>
          </div>
          <Link to="about" className="ng-textlink">
            What being a member involves <Arrow />
          </Link>
        </Reveal>
        <Reveal className="ng-statement-media" delay={120}>
          <MediaSlot kind="portrait" seed={7} ratio="4 / 5" photo={PHOTOS.collectiveSteps} brief="soloist mid-phrase, warm side light" />
          <MediaSlot kind="rehearsal" seed={4} ratio="1 / 1" photo={PHOTOS.directorListening} sizes="240px" brief="rehearsal candid, laughter between takes" className="ng-statement-inset" />
        </Reveal>
      </section>

      {/* ── Showreel ────────────────────────────── */}
      <section className="ng-reel">
        <Reveal className="ng-wrap">
          <button className="ng-reel-frame" onClick={() => setReel(0)} aria-label="Play the NextGen showreel">
            <MediaSlot kind="stage" seed={13} ratio="16 / 9" video photo={PHOTOS.rehearsalSinging} sizes="100vw" brief="90-second showreel: performance footage cut to one track" />
            <span className="ng-reel-label">
              <span className="ng-eyebrow">Showreel</span>
              <span className="ng-display">See the standard</span>
            </span>
          </button>
        </Reveal>
      </section>
      <Lightbox items={SHOWREEL} index={reel} onClose={() => setReel(null)} onIndex={setReel} />

      {/* ── Pillars ─────────────────────────────── */}
      <section className="ng-section ng-wrap">
        <Reveal className="ng-section-head">
          <Eyebrow>What we work on</Eyebrow>
          <h2 className="ng-display ng-h2">
            Four things we rehearse <NeonSign>every single week.</NeonSign>
          </h2>
        </Reveal>
        <div className="ng-pillars">
          {PILLARS.map((p, i) => (
            <Reveal as="article" key={p.key} className="ng-pillar" delay={i * 90}>
              <SitePillarCard kind={p.key} />
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteMarquee items={["Blend", "Harmony", "Precision", "Presence", "Ages 13–18", "By audition"]} />

      {/* ── Mosaic ──────────────────────────────── */}
      <section className="ng-section ng-wrap ng-mosaic">
        <Reveal className="ng-mosaic-a">
          <MediaSlot kind="stage" seed={21} ratio="3 / 2" photo={SITE_PHOTOS.handsRaised} caption="Saturday rehearsal" />
        </Reveal>
        <Reveal className="ng-mosaic-b" delay={100}>
          <MediaSlot kind="beams" seed={8} ratio="3 / 4" photo={PHOTOS.directorPortrait} caption="The director" />
        </Reveal>
        <Reveal className="ng-mosaic-c" delay={180}>
          <MediaSlot kind="rehearsal" seed={16} ratio="4 / 3" photo={PHOTOS.collectiveSteps} caption="The Collective" />
        </Reveal>
        <Reveal className="ng-mosaic-cta" delay={240}>
          <p className="ng-display">Photos and film from rehearsals, concerts and everything in between.</p>
          <ButtonLink to="gallery" variant="outline">
            Open the gallery
          </ButtonLink>
        </Reveal>
      </section>

      {/* ── Auditions teaser ────────────────────── */}
      <section className="ng-section ng-band">
        <div className="ng-wrap ng-teaser">
          <Reveal className="ng-teaser-head">
            <Eyebrow>Auditions</Eyebrow>
            <h2 className="ng-display ng-h2">
              Applying takes ten minutes <NeonSign>and a phone camera.</NeonSign>
            </h2>
            <p className="ng-muted">Everything happens through this site: your details, a short video, done. We watch every submission in full.</p>
            <ButtonLink to="auditions" anchor="apply">
              Start an application
            </ButtonLink>
          </Reveal>
          <ol className="ng-steps ng-steps--compact">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 80}>
                <span className="ng-step-n">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Instagram ───────────────────────────── */}
      <section className="ng-section ng-wrap">
        <Reveal className="ng-ig-head">
          <div>
            <Eyebrow>On Instagram</Eyebrow>
            <h2 className="ng-display ng-h2">{SITE.instagram.handle}</h2>
          </div>
          <a className="ng-btn ng-btn--outline" href={SITE.instagram.url} target="_blank" rel="noreferrer">
            <InstagramGlyph />
            <span className="ng-btn-label">Follow</span>
          </a>
        </Reveal>
        <div className="ng-ig-grid">
          {GALLERY.slice(0, 6).map((g, i) => (
            <Reveal key={g.id} delay={i * 50}>
              <a href={SITE.instagram.url} target="_blank" rel="noreferrer" className="ng-ig-tile" aria-label={`${g.title} on Instagram`}>
                <MediaSlot kind={g.kind} seed={g.seed + 100} ratio="1 / 1" showBrief={false} video={g.video} photo={g.photo} sizes="(max-width: 700px) 50vw, 220px" />
                <span className="ng-ig-hover">
                  <InstagramGlyph size={22} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
        <p className="ng-hint ng-ig-note">Live feed: latest six posts, refreshed hourly via the Instagram Graph API.</p>
      </section>
    </>
  );
}
