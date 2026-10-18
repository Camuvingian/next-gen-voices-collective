"use client";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useMotion } from "./motion";
export function NoirButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "neon" | "ghost";
}) {
  const ref = useRef<HTMLButtonElement>(null),
    m = useMotion(ref);
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      ref={ref}
      className={`nm-button nm-button--${variant} ${className}`}
      onPointerMove={(e) => {
        props.onPointerMove?.(e);
        if (!m.active || e.pointerType !== "mouse" || props.disabled) return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--nm-mx",
          `${((e.clientX - r.left) / r.width - 0.5) * 7}px`,
        );
        e.currentTarget.style.setProperty(
          "--nm-my",
          `${((e.clientY - r.top) / r.height - 0.5) * 7}px`,
        );
      }}
      onPointerLeave={(e) => {
        props.onPointerLeave?.(e);
        e.currentTarget.style.setProperty("--nm-mx", "0px");
        e.currentTarget.style.setProperty("--nm-my", "0px");
      }}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="nm-button-arrow">
        ↗
      </span>
    </button>
  );
}
export function FilmLayer({ intensity = 0.045 }: { intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null),
    m = useMotion(ref);
  return (
    <div
      ref={ref}
      className="nm-film"
      data-run={m.run}
      data-reduced={m.reduced}
      aria-hidden="true"
      style={
        {
          "--nm-grain": Math.max(0, Math.min(0.12, intensity)),
        } as CSSProperties
      }
    >
      <div className="nm-grain" />
      <div className="nm-vignette" />
    </div>
  );
}
export function Marquee({
  items,
  speed = 38,
  direction = "left",
  pauseOnHover = true,
  renderItem,
  className = "",
}: {
  items: string[];
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  /** site addition: draw each item yourself (the strings stay the screen-reader text) */
  renderItem?: (item: string, i: number) => ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null),
    row = useRef<HTMLDivElement>(null),
    m = useMotion(ref),
    [copies, setCopies] = useState(2),
    itemsKey = items.join("|");
  useEffect(() => {
    const el = ref.current,
      r = row.current;
    if (!el || !r) return;
    const measure = () =>
      setCopies(
        Math.max(
          2,
          Math.ceil(el.clientWidth / Math.max(r.scrollWidth / copies, 1)) + 1,
        ),
      );
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(r);
    measure();
    return () => ro.disconnect();
  }, [itemsKey, copies]);
  return (
    <div
      ref={ref}
      className={`nm-marquee ${className}`}
      data-run={m.run}
      data-reduced={m.reduced}
      data-hover={pauseOnHover}
      style={
        {
          "--nm-cycle": `${Math.max(5, speed)}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        } as CSSProperties
      }
    >
      <span className="nm-sr">{items.join(" · ")}</span>
      <div
        className="nm-marquee-track"
        aria-hidden="true"
        style={{
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {[0, 1].map((group) => (
          <div
            className="nm-marquee-group"
            key={group}
            ref={group === 0 ? row : undefined}
          >
            {Array.from({ length: copies }, (_, copy) => (
              <span className="nm-marquee-unit" key={copy}>
                {items.map((item, i) => (
                  <span key={i} className="nm-marquee-item">
                    {renderItem ? renderItem(item, i) : item}
                    <i>✦</i>
                  </span>
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
