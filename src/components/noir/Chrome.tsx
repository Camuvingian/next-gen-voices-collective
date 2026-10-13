"use client";

import { useEffect, useState } from "react";
import { Link, ROUTES, ROUTE_LABELS, useRouter } from "@/lib/router";
import { SITE } from "@/lib/content";
import { BrandMark, Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/noir/primitives";
import { SiteWaves } from "./SiteWaves";
import { NeonSign } from "@/components/neon/NeonSign";
import { useNeon } from "@/components/neon/NeonProvider";
import { Shimmer } from "@/components/noir-motion/Typography";

/** Stamped at build time; the site redeploys far more often than yearly. */
const BUILD_YEAR = new Date().getFullYear();

const NAV = ROUTES.filter((r) => r !== "home");

export function Nav() {
  const { route } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <header className={["ng-nav", scrolled && "is-scrolled", open && "is-open"].filter(Boolean).join(" ")}>
        <div className="ng-nav-inner">
          <Link to="home" className="ng-nav-logo" aria-label="NextGen Voice Collective, home" onClick={() => setOpen(false)}>
            <Logo markSize={36} />
          </Link>
          <nav className="ng-nav-links" aria-label="Main">
            {NAV.map((r) => (
              <Link key={r} to={r} className={route === r ? "is-active" : ""} aria-current={route === r ? "page" : undefined}>
                {ROUTE_LABELS[r]}
              </Link>
            ))}
          </nav>
          <ButtonLink to="auditions" anchor="apply" size="sm" className="ng-nav-cta">
            Apply
          </ButtonLink>
          <button className="ng-burger" aria-expanded={open} aria-controls="ng-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
          </button>
        </div>
      </header>
      <div id="ng-menu" className={["ng-menu", open && "is-open"].filter(Boolean).join(" ")} aria-hidden={!open}>
        <nav aria-label="Mobile">
          {ROUTES.map((r, i) => (
            <Link key={r} to={r} onClick={() => setOpen(false)} style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }} tabIndex={open ? 0 : -1}>
              {ROUTE_LABELS[r]}
            </Link>
          ))}
        </nav>
        <a className="ng-menu-ig" href={SITE.instagram.url} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
          {SITE.instagram.handle}
        </a>
      </div>
    </>
  );
}

/**
 * Stage-curtain page transition, in the style picked under "Page curtain" in
 * the site menu: "classic" (one panel rises over the page) or "velvet" (the
 * Noir motion drapes close from both sides over a shimmering NEXTGEN).
 */
export function Curtain() {
  const { phase } = useRouter();
  const { curtain } = useNeon();
  // remount the mark each time the curtain closes so it redraws on every page change
  const [take, setTake] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replays the intro animation on prop change (prototype behaviour)
    if (phase === "cover") setTake((t) => t + 1);
  }, [phase]);
  if (curtain === "velvet")
    return (
      <div className="nm-curtain" data-phase={phase} aria-hidden="true">
        <div className="nm-curtain-panel nm-curtain-left" />
        <div className="nm-curtain-panel nm-curtain-right" />
        <div className="nm-curtain-mark">
          <BrandMark size={108} draw={take > 0} duration={1.7} pace={0.45} replayKey={take} decorative style={{ "--ng-surface": "#0d0b0d" }} />
          <Shimmer key={take} className="nm-curtain-word" interval={2.4} delay={0.3}>
            NEXTGEN
          </Shimmer>
          <span>THE NEXT MOVEMENT</span>
        </div>
      </div>
    );
  return (
    <div className={`ng-curtain is-${phase}`} aria-hidden="true">
      <div className="ng-curtain-panel">
        <BrandMark size={150} draw={take > 0} duration={2.4} pace={0.45} replayKey={take} decorative />
      </div>
    </div>
  );
}

export function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="ng-footer">
      <section className="ng-footer-cta">
        <SiteWaves className="ng-footer-field" density={10} intensity={0.8} />
        <div className="ng-wrap ng-footer-cta-inner">
          <p className="ng-eyebrow">Next intake</p>
          <h2 className="ng-display ng-footer-title">
            Think you’ve got <NeonSign>the voice</NeonSign> and the work ethic?
          </h2>
          <div className="ng-btn-row">
            <ButtonLink to="auditions" anchor="apply" size="lg">
              Start your application
            </ButtonLink>
            <ButtonLink to="contact" variant="outline" size="lg">
              Book NextGen to perform
            </ButtonLink>
          </div>
        </div>
      </section>
      <div className="ng-wrap ng-footer-grid">
        <div className="ng-footer-brand">
          <Logo markSize={44} stacked />
          <p>
            An elite, audition-based vocal ensemble for singers aged {SITE.ages}. Rehearsing {SITE.rehearsal.day.toLowerCase()} in Richmond, performing
            across London.
          </p>
        </div>
        <nav className="ng-footer-col" aria-label="Footer">
          <h3>Explore</h3>
          {ROUTES.map((r) => (
            <Link key={r} to={r}>
              {ROUTE_LABELS[r]}
            </Link>
          ))}
        </nav>
        <div className="ng-footer-col">
          <h3>Rehearsals</h3>
          <p>
            {SITE.rehearsal.day}, {SITE.rehearsal.time}
            <br />
            {SITE.rehearsal.venue}
          </p>
          <h3>Follow</h3>
          <a href={SITE.instagram.url} target="_blank" rel="noreferrer" className="ng-ig-link">
            <InstagramGlyph /> {SITE.instagram.handle}
          </a>
        </div>
      </div>
      <div className="ng-wrap ng-footer-base">
        <span>© {BUILD_YEAR} NextGen Voice Collective</span>
        <a href={SITE.parentSite} target="_blank" rel="noreferrer">
          Private coaching: Bradley Vocal Coach ↗
        </a>
      </div>
    </footer>
  );
}
