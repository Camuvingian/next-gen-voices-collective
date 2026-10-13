"use client";

import { LogoMark } from "@/components/brand/Logo";
import { NeonBolt } from "@/components/brand/NeonBolt";
import { useNeon } from "@/components/neon/NeonProvider";
import { NeonSign } from "@/components/neon/NeonSign";
import { Shimmer } from "@/components/noir-motion/Typography";
import { SiteWaves } from "@/components/noir/SiteWaves";
import { ButtonLink, Eyebrow, RiseText } from "@/components/noir/primitives";
import { SITE } from "@/lib/content";

/**
 * The home hero, in the style chosen under "Logo" in the site menu.
 *
 * classic — the NG interlock draws above a "Young voices. / One sound." headline,
 *           with "One sound." in neon.
 * bolt    — the brand is the headline: a "NextGen Voices" neon sign with the
 *           lightning bolt at the end. It's the only neon in the hero, so the
 *           tagline below is set in silver and catches a chrome glint instead.
 *           The order: the bolt is sprayed on, the lettering lights, a spark runs
 *           round the bolt and it strikes; the waves ripple out from it and the
 *           glint crosses the tagline.
 *
 * The waves, lede, buttons and facts are shared, so switching keeps the waves running.
 */
export function HomeHero() {
  const { logo } = useNeon();
  return (
    <section className={`ng-hero ng-hero--${logo}`}>
      <SiteWaves className="ng-hero-field" />
      <div className="ng-hero-vignette" aria-hidden="true" />
      <div className="ng-wrap ng-hero-inner">
        {logo === "classic" ? <ClassicHead /> : <BoltHead />}
        <p className="ng-hero-lede">
          An elite ensemble for outstanding singers who are ready to be challenged, rehearsing every week at a standard most adult groups aim for.
        </p>
        <div className="ng-btn-row ng-hero-ctas">
          <ButtonLink to="auditions" anchor="apply" size="lg">
            Apply to audition
          </ButtonLink>
          <ButtonLink to="contact" variant="outline" size="lg">
            Book us to perform
          </ButtonLink>
        </div>
      </div>
      <dl className="ng-wrap ng-hero-facts">
        <div>
          <dt>Ages</dt>
          <dd>{SITE.ages}</dd>
        </div>
        <div>
          <dt>Rehearsals</dt>
          <dd>
            {SITE.rehearsal.day} {SITE.rehearsal.time}
          </dd>
        </div>
        <div>
          <dt>Entry</dt>
          <dd>By audition</dd>
        </div>
      </dl>
    </section>
  );
}

function HeroEyebrow() {
  return (
    <Eyebrow className="ng-hero-eyebrow">
      Audition-based vocal collective <span className="ng-dot" /> Ages {SITE.ages} <span className="ng-dot" /> London
    </Eyebrow>
  );
}

function ClassicHead() {
  return (
    <>
      <div className="ng-hero-mark">
        <LogoMark size="100%" draw delay={0.15} />
      </div>
      <HeroEyebrow />
      <h1 className="ng-hero-title">
        <span className="ng-hero-kicker">NextGen</span>
        <span className="ng-hero-line">
          <RiseText text="Young voices." delay={250} />
        </span>
        <span className="ng-hero-line ng-italic">
          <NeonSign rise={450} glow={1.25}>
            One sound.
          </NeonSign>
        </span>
      </h1>
    </>
  );
}

/** the lightning strike sends a ripple through the waves (see noir-motion/HarmonicField) */
const strike = (centre: { x: number; y: number }) => window.dispatchEvent(new CustomEvent("ng:strike", { detail: centre }));

function BoltHead() {
  return (
    <>
      <HeroEyebrow />
      <h1 className="ng-hero-sign">
        <NeonSign rise={150} glow={1.25}>
          NextGen
        </NeonSign>{" "}
        {/* the bolt never wraps away from the last word */}
        <span className="ng-hero-sign-end">
          <NeonSign rise={230} glow={1.25}>
            Voices
          </NeonSign>
          <NeonBolt className="ng-hero-bolt" trigger="mount" delay={1.2} label={null} onStrike={strike} />
        </span>
      </h1>
      {/* two phrases, so phones break the line between them; the glint runs on from one to the next */}
      <p className="ng-hero-tagline">
        <Shimmer interval={9} delay={3.4}>
          Young voices.
        </Shimmer>{" "}
        <Shimmer interval={9} delay={3.62}>
          One sound.
        </Shimmer>
      </p>
    </>
  );
}
