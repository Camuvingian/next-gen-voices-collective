import { MediaSlot } from "../components/MediaSlot";
import { ButtonLink, Eyebrow, Reveal, RiseText } from "../components/ui";
import { GAINS, SESSION_FLOW, SITE } from "../lib/content";

export function PageHeader({ eyebrow, title, italic, lede }: { eyebrow: string; title: string; italic?: string; lede?: string }) {
  return (
    <header className="ng-pagehead ng-wrap">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="ng-display ng-h1">
        <RiseText text={title} />
        {italic && (
          <>
            {" "}
            <em>
              <RiseText text={italic} delay={180} />
            </em>
          </>
        )}
      </h1>
      {lede && <p className="ng-pagehead-lede">{lede}</p>}
      <span className="ng-voice-line" aria-hidden="true" />
    </header>
  );
}

export function About() {
  return (
    <>
      <PageHeader
        eyebrow="About NextGen"
        title="A collective built on"
        italic="high standards."
        lede="NextGen Voice Collective is an audition-based ensemble for outstanding young singers aged 13 to 18 who want to be challenged, inspired and pushed to the next level."
      />

      <section className="ng-wrap ng-about-hero">
        <Reveal>
          <MediaSlot kind="stage" seed={52} ratio="21 / 9" brief="panoramic performance shot, audience in foreground" />
        </Reveal>
      </section>

      {/* Who it's for */}
      <section className="ng-section ng-wrap ng-split">
        <Reveal className="ng-split-label">
          <Eyebrow>Who it's for</Eyebrow>
        </Reveal>
        <Reveal className="ng-split-body">
          <h2 className="ng-display ng-h2">
            Ambitious performers who thrive <em>alongside others.</em>
          </h2>
          <p className="ng-lead">
            Members are selected for their vocal ability, and just as much for their commitment, discipline and desire to develop as part of a
            unified group. If you value high standards and want to challenge yourself with like-minded singers, this is your room.
          </p>
          <ul className="ng-criteria">
            <li>
              <strong>Vocal ability</strong>
              <span>Tone, tuning and musical instinct, in any style.</span>
            </li>
            <li>
              <strong>Commitment</strong>
              <span>Every Saturday, every term, prepared.</span>
            </li>
            <li>
              <strong>Discipline</strong>
              <span>Practising between sessions and taking notes on board.</span>
            </li>
            <li>
              <strong>Ensemble mindset</strong>
              <span>Listening as hard as you sing.</span>
            </li>
          </ul>
        </Reveal>
      </section>

      {/* Inside a rehearsal */}
      <section className="ng-section ng-band">
        <div className="ng-wrap">
          <Reveal className="ng-section-head">
            <Eyebrow>Inside a rehearsal</Eyebrow>
            <h2 className="ng-display ng-h2">
              Ninety minutes, <em>no passengers.</em>
            </h2>
            <p className="ng-muted">
              {SITE.rehearsal.day}, {SITE.rehearsal.time} at {SITE.rehearsal.venue}. Every session follows the same arc, from individual voice to
              full ensemble.
            </p>
          </Reveal>
          <ol className="ng-flow">
            {SESSION_FLOW.map((s, i) => (
              <Reveal as="li" key={s.phase} delay={i * 90}>
                <span className="ng-flow-bar" style={{ ["--i" as string]: i }} aria-hidden="true" />
                <h3>{s.phase}</h3>
                <p>{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Performances */}
      <section className="ng-section ng-wrap ng-perf">
        <Reveal className="ng-perf-media">
          <MediaSlot kind="beams" seed={61} ratio="4 / 5" brief="performance, stage lights, mid-song" />
        </Reveal>
        <Reveal className="ng-perf-text" delay={100}>
          <Eyebrow>Performance</Eyebrow>
          <h2 className="ng-display ng-h2">
            Rehearsal is the work. <em>The stage is the point.</em>
          </h2>
          <p className="ng-lead">
            Through the year the Collective performs at concerts, showcases, community events and private bookings. Each one is a chance to put
            the weekly detail in front of a real audience.
          </p>
          <ul className="ng-ticks">
            <li>Termly showcases for family and friends</li>
            <li>Concerts and festivals across London</li>
            <li>Corporate, charity and private events</li>
            <li>Recording and filmed content for our channels</li>
          </ul>
          <ButtonLink to="contact" variant="outline">
            Book the Collective
          </ButtonLink>
        </Reveal>
      </section>

      {/* What singers gain */}
      <section className="ng-section ng-wrap">
        <Reveal className="ng-section-head">
          <Eyebrow>What singers gain</Eyebrow>
          <h2 className="ng-display ng-h2">
            Skills that outlast <em>any single concert.</em>
          </h2>
        </Reveal>
        <div className="ng-gains">
          {GAINS.map((g, i) => (
            <Reveal as="article" key={g.title} className="ng-gain" delay={i * 80}>
              <h3>{g.title}</h3>
              <p>{g.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Ensemble quote */}
      <section className="ng-section ng-wrap">
        <Reveal className="ng-quote">
          <blockquote className="ng-display">
            A sound no single member could make alone, from a group where every member still sounds like themselves.
          </blockquote>
          <p className="ng-muted">The NextGen principle</p>
        </Reveal>
      </section>

      {/* Key facts */}
      <section className="ng-wrap ng-facts">
        <Reveal>
          <dl className="ng-factgrid">
            <div>
              <dt>Ages</dt>
              <dd>{SITE.ages}</dd>
            </div>
            <div>
              <dt>Rehearsals</dt>
              <dd>
                {SITE.rehearsal.day}
                <br />
                {SITE.rehearsal.time}
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{SITE.rehearsal.venue}</dd>
            </div>
            <div>
              <dt>Fees</dt>
              <dd>
                {SITE.term.fee} per {SITE.term.length}
              </dd>
            </div>
          </dl>
          <div className="ng-facts-cta">
            <ButtonLink to="auditions" anchor="apply" size="lg">
              Apply to audition
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
