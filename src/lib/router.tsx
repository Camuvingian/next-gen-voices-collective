"use client";

import NextLink from "next/link";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

export const ROUTES = ["home", "about", "auditions", "gallery", "contact"] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_LABELS: Record<Route, string> = {
  home: "Home",
  about: "About",
  auditions: "Auditions",
  gallery: "Gallery",
  contact: "Contact",
};

export const hrefFor = (to: Route, anchor?: string) => `${to === "home" ? "/" : `/${to}`}${anchor ? `#${anchor}` : ""}`;

function routeFromPath(path: string): Route {
  const seg = path.split("/")[1] ?? "";
  return (ROUTES as readonly string[]).includes(seg) ? (seg as Route) : "home";
}

type Phase = "idle" | "cover" | "reveal";

type RouterCtx = {
  route: Route;
  phase: Phase;
  navigate: (to: Route, opts?: { anchor?: string }) => void;
};

const Ctx = createContext<RouterCtx | null>(null);

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Wraps the App Router with the prototype's stage-curtain transition:
 * the curtain covers the page, the route changes underneath, then it lifts.
 *
 * router.push() returns nothing to await, so the lift waits for the new
 * pathname to commit (this provider's effects run after the new page's), with
 * a time limit so a slow or failed navigation can never leave the curtain down.
 */
const COVER_MS = 820;
const LIFT_MS = 830;
const MOUNT_TIMEOUT_MS = 4000;

export function RouterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useNextRouter();
  const route = routeFromPath(pathname);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);
  const arrival = useRef<{ path: string; lift: () => void } | null>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // the destination page has mounted: lift the curtain
  useEffect(() => {
    const a = arrival.current;
    if (a && a.path === pathname) a.lift();
  }, [pathname]);

  const navigate = useCallback(
    (to: Route, opts?: { anchor?: string }) => {
      if (to === route) {
        if (opts?.anchor) document.getElementById(opts.anchor)?.scrollIntoView({ behavior: "smooth" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const href = hrefFor(to, opts?.anchor);
      const path = hrefFor(to);
      timers.current.forEach(clearTimeout);
      arrival.current = null;
      if (reduceMotion()) return router.push(href);
      router.prefetch(href);
      setPhase("cover");
      const lift = () => {
        if (arrival.current?.lift !== lift) return; // superseded by a newer click
        arrival.current = null;
        timers.current.forEach(clearTimeout);
        setPhase("reveal");
        timers.current = [
          window.setTimeout(() => {
            setPhase("idle");
            // hand focus to the new page, as a full page load would
            document.getElementById("main")?.focus({ preventScroll: true });
          }, LIFT_MS),
        ];
      };
      timers.current = [
        window.setTimeout(() => {
          arrival.current = { path, lift };
          timers.current.push(window.setTimeout(lift, MOUNT_TIMEOUT_MS));
          router.push(href);
        }, COVER_MS),
      ];
    },
    [route, router],
  );

  return <Ctx.Provider value={{ route, phase, navigate }}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRouter outside RouterProvider");
  return c;
}

/** Real <a href> (via next/link) that plays the curtain on plain clicks. */
export function Link({
  to,
  anchor,
  className,
  children,
  onClick,
  ...rest
}: {
  to: Route;
  anchor?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  const { navigate } = useRouter();
  return (
    <NextLink
      href={hrefFor(to, anchor)}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onClick?.();
        navigate(to, { anchor });
      }}
      {...rest}
    >
      {children}
    </NextLink>
  );
}
