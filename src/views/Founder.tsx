import Image from "next/image";
import { CreditsRibbon } from "@/components/noir/CreditsRibbon";
import { MediaSlot } from "@/components/noir/MediaSlot";
import { buttonVariants } from "@/components/ui/button";
import { Arrow, ButtonLink, Eyebrow, Reveal } from "@/components/noir/primitives";
import { NeonSign } from "@/components/neon/NeonSign";
import { FOUNDER } from "@/lib/content";
import { FOUNDER_PHOTOS } from "@/lib/media";
import { PageHeader } from "./About";

/**
 * The founder, Bradley Barton-Young. Copy comes from the "About" page of his
 * coaching site (bradleyvocalcoach.com/about), photos and logo too; see FOUNDER
 * in lib/content.ts.
 */
export function Founder() {
  return (
    <>
      <PageHeader eyebrow="Founder" title={FOUNDER.first} italic={FOUNDER.last} lede={FOUNDER.lede} />

      {/* Who he is */}
      <section className="ng-section ng-wrap ng-perf ng-founder-intro">
        <Reveal className="ng-perf-media">
          <MediaSlot ratio="4 / 5" photo={FOUNDER_PHOTOS.portrait} sizes="(max-width: 860px) 100vw, 45vw" />
        </Reveal>
        <Reveal className="ng-perf-text" delay={100}>
          <Eyebrow>About Bradley</Eyebrow>
          <h2 className="ng-display ng-h2">
            Performer, writer, <NeonSign>coach.</NeonSign>
          </h2>
          {FOUNDER.intro.map((p) => (
            <p key={p.slice(0, 24)} className="ng-lead">
              {p}
            </p>
          ))}
          <dl className="ng-founder-stats">
            {FOUNDER.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* Credits: the logo ribbon from his coaching site */}
      <section className="ng-founder-credits" aria-label="Artists, stages and brands Bradley and his singers have worked with">
        <Eyebrow className="ng-wrap">Artists, stages &amp; credits</Eyebrow>
        <CreditsRibbon />
      </section>

      {/* Teaching */}
      <section className="ng-section ng-band">
        <div className="ng-wrap ng-split">
          <Reveal className="ng-split-label">
            <Eyebrow>Teaching</Eyebrow>
          </Reveal>
          <Reveal className="ng-split-body">
            <h2 className="ng-display ng-h2">
              Training the <NeonSign>next generation.</NeonSign>
            </h2>
            {FOUNDER.teaching.map((p) => (
              <p key={p.slice(0, 24)} className="ng-lead">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="ng-section ng-wrap">
        <Reveal className="ng-quote">
          <blockquote className="ng-display">{FOUNDER.quotes[0]}</blockquote>
          <p className="ng-muted">{FOUNDER.name}</p>
        </Reveal>
      </section>

      {/* His singers */}
      <section className="ng-section ng-wrap ng-perf ng-founder-singers">
        <Reveal className="ng-perf-text">
          <Eyebrow>His singers</Eyebrow>
          <h2 className="ng-display ng-h2">
            From the practice room <NeonSign>to the Royal Albert Hall.</NeonSign>
          </h2>
          <p className="ng-lead">{FOUNDER.singers}</p>
          <ul className="ng-ticks">
            {FOUNDER.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="ng-perf-media" delay={100}>
          <MediaSlot ratio="16 / 11" photo={FOUNDER_PHOTOS.onStage} sizes="(max-width: 860px) 100vw, 50vw" />
        </Reveal>
      </section>

      <section className="ng-section ng-wrap">
        <Reveal className="ng-quote">
          <blockquote className="ng-display">{FOUNDER.quotes[1]}</blockquote>
          <p className="ng-muted">{FOUNDER.name}</p>
        </Reveal>
      </section>

      {/* Private coaching */}
      <section className="ng-wrap ng-facts">
        <Reveal className="ng-founder-coach">
          <a href={FOUNDER.coaching.url} target="_blank" rel="noreferrer" className="ng-founder-logo" aria-label="Bradley Vocal Coach (opens in a new tab)">
            <Image src={FOUNDER_PHOTOS.logo.src} alt="" width={FOUNDER_PHOTOS.logo.width} height={FOUNDER_PHOTOS.logo.height} sizes="320px" />
          </a>
          <p className="ng-lead">{FOUNDER.coaching.body}</p>
          <div className="ng-btn-row">
            <a href={FOUNDER.coaching.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
              <span className="ng-btn-label">Private coaching with Bradley</span>
              <Arrow />
            </a>
            <ButtonLink to="auditions" anchor="apply">
              Audition for NextGen
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
