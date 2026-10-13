"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useMotion } from "./motion";
export function NeonText({
  children,
  as: Tag = "span",
  intensity = "hero",
  className = "",
  flicker = true,
  replayKey = 0,
}: {
  children: string;
  as?: "em" | "span";
  intensity?: "hero" | "inline";
  className?: string;
  flicker?: boolean;
  replayKey?: number;
}) {
  const ref = useRef<HTMLElement>(null),
    motion = useMotion(ref);
  const [drop, setDrop] = useState(false);
  useEffect(() => {
    if (!motion.active || !flicker) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setDrop(true);
          timer = setTimeout(() => {
            setDrop(false);
            schedule();
          }, 650);
        },
        8000 + Math.random() * 7000,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [motion.active, flicker, replayKey]);
  return (
    <Tag
      ref={ref}
      className={`nm-neon nm-neon--${intensity} ${className}`}
      data-run={motion.run}
      data-reduced={motion.reduced}
      data-drop={drop && motion.active && flicker}
    >
      <span key={replayKey} className="nm-neon-power">
        <span aria-hidden="true" className="nm-neon-wall">
          {children}
        </span>
        <span aria-hidden="true" className="nm-neon-glass">
          {children}
        </span>
        <span className="nm-neon-core">{children}</span>
      </span>
    </Tag>
  );
}
export function Shimmer({
  children,
  interval = 8,
  delay = 1.5,
  className = "",
}: {
  children: string;
  interval?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null),
    m = useMotion(ref);
  return (
    <span
      ref={ref}
      data-run={m.run}
      data-reduced={m.reduced}
      className={`nm-shimmer ${className}`}
      style={
        {
          "--nm-cycle": `${Math.max(2, interval)}s`,
          "--nm-delay": `${Math.max(0, delay)}s`,
        } as CSSProperties
      }
    >
      {children}
      <span aria-hidden="true" className="nm-shimmer-light">
        {children}
      </span>
    </span>
  );
}
export function RiseText({
  text,
  delay = 0,
  stagger = 65,
}: {
  text: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null),
    m = useMotion(ref);
  return (
    <span
      ref={ref}
      className="nm-rise"
      data-run={m.run}
      data-reduced={m.reduced}
      aria-label={text}
    >
      {text.split(" ").map((word, i) => (
        <span key={i} aria-hidden="true" className="nm-rise-mask">
          <span style={{ animationDelay: `${delay + i * stagger}ms` }}>
            {word}
          </span>{" "}
        </span>
      ))}
    </span>
  );
}
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null),
    [state, setState] = useState("visible");
  const m = useMotion(ref);
  useEffect(() => {
    const el = ref.current;
    if (!el || m.reduced || typeof IntersectionObserver === "undefined") {
      setState("visible");
      return;
    }
    if (el.getBoundingClientRect().top < innerHeight) return;
    setState("waiting");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("entered");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -3% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [m.reduced]);
  return (
    <div
      ref={ref}
      className={`nm-reveal ${className}`}
      data-state={state}
      data-reduced={m.reduced}
      style={{ "--nm-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
