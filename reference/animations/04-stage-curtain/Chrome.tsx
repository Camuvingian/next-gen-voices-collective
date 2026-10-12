import { useEffect, useState } from "react";
import { Link, ROUTES, ROUTE_LABELS, useRouter } from "../lib/router";
import { SITE } from "../lib/content";
import { Logo, LogoMark } from "./Logo";
import { ButtonLink } from "./ui";
import { HarmonicField } from "./HarmonicField";

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

/** Stage-curtain page transition. */
export function Curtain() {
  const { phase } = useRouter();
  // remount the mark each time the curtain closes so it redraws on every page change
  const [take, setTake] = useState(0);
  useEffect(() => {
    if (phase === "cover") setTake((t) => t + 1);
  }, [phase]);
  return (
    <div className={`ng-curtain is-${phase}`} aria-hidden="true">
      <div className="ng-curtain-panel">
        <LogoMark size={150} draw={take > 0} duration={2.4} replayKey={take} decorative />
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
        <HarmonicField className="ng-footer-field" density={10} intensity={0.8} />
        <div className="ng-wrap ng-footer-cta-inner">
          <p className="ng-eyebrow">Next intake</p>
          <h2 className="ng-display ng-footer-title">
            Think you've got <em>the voice</em> and the work ethic?
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
        <span>© {new Date().getFullYear()} NextGen Voice Collective</span>
        <a href={SITE.parentSite} target="_blank" rel="noreferrer">
          Private coaching: Bradley Vocal Coach ↗
        </a>
      </div>
    </footer>
  );
}
