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
 */
export function RouterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useNextRouter();
  const route = routeFromPath(pathname);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const navigate = useCallback(
    (to: Route, opts?: { anchor?: string }) => {
      if (to === route) {
        if (opts?.anchor) document.getElementById(opts.anchor)?.scrollIntoView({ behavior: "smooth" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const href = hrefFor(to, opts?.anchor);
      timers.current.forEach(clearTimeout);
      if (reduceMotion()) return router.push(href);
      router.prefetch(href);
      setPhase("cover");
      timers.current = [
        window.setTimeout(() => {
          router.push(href);
          setPhase("reveal");
        }, 820),
        window.setTimeout(() => setPhase("idle"), 1650),
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
