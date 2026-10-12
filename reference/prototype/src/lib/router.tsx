import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type AnchorHTMLAttributes } from "react";

export const ROUTES = ["home", "about", "auditions", "gallery", "contact"] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_LABELS: Record<Route, string> = {
  home: "Home",
  about: "About",
  auditions: "Auditions",
  gallery: "Gallery",
  contact: "Contact",
};

type Phase = "idle" | "cover" | "reveal";

type RouterCtx = {
  route: Route;
  phase: Phase;
  navigate: (to: Route, opts?: { anchor?: string }) => void;
};

const Ctx = createContext<RouterCtx | null>(null);

function readHash(): Route {
  const h = window.location.hash.replace("#", "") as Route;
  return (ROUTES as readonly string[]).includes(h) ? h : "home";
}

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Tiny hash router with a stage-curtain transition.
 * In production this is replaced by Next.js App Router + a template.tsx
 * that runs the same curtain via Motion's AnimatePresence.
 */
export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(readHash);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  const swap = useCallback((to: Route, anchor?: string) => {
    setRoute(to);
    requestAnimationFrame(() => {
      if (anchor) document.getElementById(anchor)?.scrollIntoView();
      else window.scrollTo({ top: 0 });
    });
  }, []);

  const navigate = useCallback(
    (to: Route, opts?: { anchor?: string }) => {
      if (to === route && !opts?.anchor) return window.scrollTo({ top: 0, behavior: "smooth" });
      if (to === route && opts?.anchor) {
        document.getElementById(opts.anchor)?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      try {
        history.pushState(null, "", `#${to}`);
      } catch {
        /* sandboxed frames may refuse; state still updates */
      }
      timers.current.forEach(clearTimeout);
      if (reduceMotion()) return swap(to, opts?.anchor);
      setPhase("cover");
      timers.current = [
        window.setTimeout(() => {
          swap(to, opts?.anchor);
          setPhase("reveal");
        }, 820),
        window.setTimeout(() => setPhase("idle"), 1650),
      ];
    },
    [route, swap],
  );

  useEffect(() => {
    const onPop = () => swap(readHash());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, [swap]);

  return <Ctx.Provider value={{ route, phase, navigate }}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRouter outside RouterProvider");
  return c;
}

/** Anchor that routes without a full reload and keeps a real href for a11y. */
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
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        onClick?.();
        navigate(to, { anchor });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
