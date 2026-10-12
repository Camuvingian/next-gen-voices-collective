"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loadPiano, noteOff, noteOn, strike } from "./pianoEngine";

/**
 * NextGen Piano Rail: a real sampled piano running down the left edge of the page.
 *
 *  - Hidden by default. A floating glass button (bottom-left) shows and hides it.
 *  - Scrolling moves a triad down the keyboard: the key at your scroll position
 *    plus the third and fifth above it go down.
 *  - Press a key to play it, hold to sustain, release lifts the damper, drag to glissando.
 *  - The ♪ button at the foot of the rail makes scrolling play the lead note
 *    (off by default: browsers only allow sound after a tap).
 *  - Top key = C3 (MIDI 48) by default; pitch rises down the page.
 *
 * Styles: NextGenPianoRail.css (classes prefixed `ngp-`, themed by CSS variables).
 * Sound: pianoEngine.ts + pianoSamples.ts (21 acoustic-grand samples, C3–C8).
 */

const WHITE_SEMIS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_AFTER: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; // C♯ D♯ F♯ G♯ A♯
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

type Key = { id: string; kind: "white" | "black"; index: number; midi: number; top: number; h: number };

export interface NextGenPianoRailProps {
  /** Controlled open state. Omit to let the component manage it. */
  open?: boolean;
  /** Initial state when uncontrolled. Default false (hidden). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render the floating show/hide button. Default true. */
  showToggle?: boolean;
  /** Render the ♪ "play while scrolling" button. Default true. */
  showSoundButton?: boolean;
  /** Remember open/closed in localStorage under this key. null disables. Default "ngp-open". */
  persistKey?: string | null;
  /** MIDI note of the top key. Default 48 (C3). Samples cover 48–108. */
  baseMidi?: number;
  /** White-key height in px: [desktop, under 700px]. Default [30, 24]. */
  keyHeight?: [number, number];
  /** Show the moving triad as you scroll. Default true. */
  scrollTriad?: boolean;
  /** Set data-ngp-open on <html> while open so the host can offset its layout. Default true. */
  pushContent?: boolean;
  className?: string;
  style?: CSSProperties & Partial<Record<`--ngp-${string}`, string | number>>;
}

function readPersisted(key: string | null, fallback: boolean) {
  if (!key) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "on";
  } catch {
    return fallback;
  }
}

export function NextGenPianoRail({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  showToggle = true,
  showSoundButton = true,
  persistKey = "ngp-open",
  baseMidi = 48,
  keyHeight = [30, 24],
  scrollTriad = true,
  pushContent = true,
  className,
  style,
}: NextGenPianoRailProps) {
  const [openState, setOpenState] = useState(() => readPersisted(persistKey, defaultOpen));
  const open = openProp ?? openState;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const [vh, setVh] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  const [narrow, setNarrow] = useState(() => (typeof window === "undefined" ? false : window.innerWidth < 700));
  const [lead, setLead] = useState(-1);
  const [held, setHeld] = useState<Set<string>>(() => new Set());
  const [sound, setSound] = useState(false);
  const [intro, setIntro] = useState(false);
  const lastLead = useRef(-1);
  const pointerDown = useRef(false);

  // expose state to the host page (layout offset) and remember it
  useEffect(() => {
    const root = document.documentElement;
    if (pushContent && open) root.dataset.ngpOpen = "";
    else delete root.dataset.ngpOpen;
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, open ? "on" : "off");
      } catch {
        /* storage blocked */
      }
    }
    if (open) {
      // the opening glissando starts on the next frame, once the rail is sliding in
      const f = requestAnimationFrame(() => setIntro(true));
      const t = window.setTimeout(() => setIntro(false), 1400);
      return () => {
        cancelAnimationFrame(f);
        clearTimeout(t);
      };
    }
  }, [open, pushContent, persistKey]);
  useEffect(() => () => void delete document.documentElement.dataset.ngpOpen, []);

  useEffect(() => {
    const r = () => {
      setVh(window.innerHeight);
      setNarrow(window.innerWidth < 700);
    };
    const up = () => (pointerDown.current = false);
    window.addEventListener("resize", r);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("resize", r);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const keyH = narrow ? keyHeight[1] : keyHeight[0];
  const keys = useMemo<Key[]>(() => {
    const n = Math.ceil(vh / keyH) + 1;
    const out: Key[] = [];
    for (let i = 0; i < n; i++) {
      const pos = i % 7;
      const oct = Math.floor(i / 7);
      out.push({ id: `w${i}`, kind: "white", index: i, midi: baseMidi + oct * 12 + WHITE_SEMIS[pos], top: i * keyH, h: keyH });
      if (pos in BLACK_AFTER && i < n - 1) {
        const bh = keyH * 0.62;
        out.push({ id: `b${i}`, kind: "black", index: i, midi: baseMidi + oct * 12 + BLACK_AFTER[pos], top: (i + 1) * keyH - bh / 2, h: bh });
      }
    }
    return out;
  }, [vh, keyH, baseMidi]);
  const whites = useMemo(() => keys.filter((k) => k.kind === "white"), [keys]);

  // scroll → moving triad (and, if enabled, the melody)
  useEffect(() => {
    if (!open || !scrollTriad) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      const i = Math.round(p * Math.max(1, whites.length - 5));
      setLead(i);
      if (i !== lastLead.current) {
        if (sound && lastLead.current !== -1) {
          const k = whites[i];
          if (k) strike(k.midi, 0.55);
        }
        lastLead.current = i;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [open, scrollTriad, whites, sound]);

  const press = useCallback((k: Key, velocity = 0.75) => {
    void noteOn(k.midi, velocity);
    setHeld((s) => new Set(s).add(k.id));
  }, []);
  const release = useCallback((k: Key) => {
    noteOff(k.midi);
    setHeld((s) => {
      const n = new Set(s);
      n.delete(k.id);
      return n;
    });
  }, []);

  const isDown = (k: Key) =>
    held.has(k.id) || (scrollTriad && k.kind === "white" && (k.index === lead || k.index === lead + 2 || k.index === lead + 4));

  return (
    <>
      <aside
        className={["ngp-rail", open && "is-open", intro && "is-intro", className].filter(Boolean).join(" ")}
        style={style}
        aria-label="Piano"
        aria-hidden={!open}
      >
        <div className="ngp-keys" onPointerLeave={() => (pointerDown.current = false)}>
          {keys.map((k) => (
            <button
              key={k.id}
              type="button"
              tabIndex={-1}
              aria-label={`${NAMES[k.midi % 12]}${Math.floor(k.midi / 12) - 1}`}
              className={["ngp-key", `is-${k.kind}`, isDown(k) && "is-down", scrollTriad && k.kind === "white" && k.index === lead && "is-lead"]
                .filter(Boolean)
                .join(" ")}
              style={{ top: k.top, height: k.h, ["--i" as string]: k.index }}
              onPointerDown={(e) => {
                e.preventDefault();
                pointerDown.current = true;
                (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                press(k);
              }}
              onPointerEnter={() => pointerDown.current && press(k, 0.6)}
              onPointerUp={() => release(k)}
              onPointerLeave={() => held.has(k.id) && release(k)}
            />
          ))}
        </div>
        {showSoundButton && (
          <button
            type="button"
            className={["ngp-sound", sound && "is-on"].filter(Boolean).join(" ")}
            aria-pressed={sound}
            aria-label={sound ? "Stop playing notes while scrolling" : "Play notes while scrolling"}
            title={sound ? "Scroll sound on" : "Scroll sound off"}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              const next = !sound;
              setSound(next);
              if (next) {
                void loadPiano();
                [60, 64, 67, 72].forEach((m, i) => window.setTimeout(() => strike(m, 0.5, 900), i * 110)); // C major arpeggio
              }
            }}
          >
            ♪
          </button>
        )}
      </aside>
      {showToggle && (
        <button
          type="button"
          className={["ngp-toggle", open && "is-open"].filter(Boolean).join(" ")}
          aria-pressed={open}
          aria-label={open ? "Hide piano" : "Show piano"}
          onClick={() => {
            setOpen(!open);
            void loadPiano(); // decode samples ahead of the first key press
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4v16M13 4v16M18 4v16" stroke="currentColor" strokeWidth="1.2" />
            <rect x="6.6" y="4" width="2.8" height="9" fill="currentColor" />
            <rect x="11.6" y="4" width="2.8" height="9" fill="currentColor" />
            <rect x="16.6" y="4" width="2.8" height="9" fill="currentColor" />
          </svg>
          <span className="ngp-toggle-label">{open ? "Hide piano" : "Piano"}</span>
        </button>
      )}
    </>
  );
}

export default NextGenPianoRail;
