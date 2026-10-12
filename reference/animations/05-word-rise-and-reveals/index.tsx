/**
 * UI primitives, written in the shadcn/ui pattern (cva variants + tokens),
 * so they can be swapped for the generated shadcn components 1:1 later.
 */
import { cva, type VariantProps } from "class-variance-authority";
import {
  Fragment,
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type RefObject,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Link, type Route } from "../../lib/router";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Button ─────────────────────────────────────────────── */
export const buttonVariants = cva("ng-btn", {
  variants: {
    variant: {
      primary: "ng-btn--primary",
      outline: "ng-btn--outline",
      ghost: "ng-btn--ghost",
      link: "ng-btn--link",
    },
    size: { sm: "ng-btn--sm", md: "", lg: "ng-btn--lg" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
type BtnVariants = VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & BtnVariants>(
  ({ className, variant, size, children, ...props }, ref) => (
    <button ref={ref} className={cx(buttonVariants({ variant, size }), className)} {...props}>
      <span className="ng-btn-label">{children}</span>
    </button>
  ),
);
Button.displayName = "Button";

export function ButtonLink({
  to,
  anchor,
  children,
  className,
  variant,
  size,
  arrow = true,
}: { to: Route; anchor?: string; children: ReactNode; className?: string; arrow?: boolean } & BtnVariants) {
  return (
    <Link to={to} anchor={anchor} className={cx(buttonVariants({ variant, size }), className)}>
      <span className="ng-btn-label">{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg className={cx("ng-arrow", className)} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/* ── Form fields ────────────────────────────────────────── */
type FieldShell = { label: string; hint?: string; error?: string; required?: boolean; id: string; children: ReactNode; className?: string };
export function Field({ label, hint, error, required, id, children, className }: FieldShell) {
  return (
    <div className={cx("ng-field-row", error && "has-error", className)}>
      <label htmlFor={id} className="ng-label">
        {label}
        {required ? <span className="ng-req" aria-hidden="true"> *</span> : <span className="ng-opt"> optional</span>}
      </label>
      {children}
      {error ? (
        <p className="ng-error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ng-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cx("ng-input", className)} {...p} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cx("ng-input ng-textarea", className)} {...p} />,
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder?: string }>(
  ({ className, options, placeholder = "Choose…", ...p }, ref) => (
    <div className="ng-select-wrap">
      <select ref={ref} className={cx("ng-input ng-select", className)} {...p}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </div>
  ),
);
Select.displayName = "Select";

/** Segmented radio group — large tappable choices (mobile-first). */
export function Choice<T extends string>({
  name,
  value,
  onChange,
  options,
  columns = 2,
}: {
  name: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string; detail?: string }[];
  columns?: number;
}) {
  return (
    <div className="ng-choice" role="radiogroup" style={{ ["--cols" as string]: columns }}>
      {options.map((o) => (
        <label key={o.value} className={cx("ng-choice-item", value === o.value && "is-on")}>
          <input type="radio" id={`${name}-${o.value}`} name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span className="ng-choice-dot" aria-hidden="true" />
          <span className="ng-choice-text">
            <strong>{o.label}</strong>
            {o.detail && <small>{o.detail}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ── Layout helpers ─────────────────────────────────────── */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("ng-eyebrow", className)}>{children}</p>;
}

/**
 * Reveal — content is visible at rest. Only elements that start below the
 * fold are held back, then eased in as they scroll into view.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  as?: "div" | "section" | "li" | "article" | "header";
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"rest" | "pending" | "in">("rest");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) return; // already on screen: leave at rest
    setState("pending");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as "div";
  return (
    <T
      ref={ref as RefObject<HTMLDivElement>}
      id={id}
      className={cx("ng-reveal", state === "pending" && "is-pending", state === "in" && "is-in", className)}
      style={{ transitionDelay: state === "in" ? `${delay}ms` : undefined }}
    >
      {children}
    </T>
  );
}

/** Split a headline into words that rise in on load. */
export function RiseText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={cx("ng-rise", className)} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
        {i > 0 && " "}
        <span className="ng-rise-mask" aria-hidden="true">
          <span className="ng-rise-word" style={{ animationDelay: `${delay + i * 70}ms` }}>
            {w}
          </span>
        </span>
        </Fragment>
      ))}
    </span>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = (
    <div className="ng-marquee-row" aria-hidden="true">
      {items.map((t, i) => (
        <span key={i} className="ng-marquee-item">
          {t}
          <svg viewBox="0 0 40 12" width="40" height="12">
            <path d="M0 6 Q5 0 10 6 T20 6 T30 6 T40 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ng-marquee" role="presentation">
      {row}
      {row}
    </div>
  );
}
