"use client";

import { useEffect, useRef } from "react";
import type { GalleryItem } from "@/lib/content";
import { MediaSlot } from "./MediaSlot";

type Props = {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
};

/** Full-screen viewer with keyboard + swipe. Films play here, streamed from the Blob store via /api/film. */
export function Lightbox({ items, index, onClose, onIndex }: Props) {
  const startX = useRef<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(((index ?? 0) + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex(((index ?? 0) - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [open, index, items.length, onClose, onIndex]);

  if (!open) return null;
  const item = items[index!];
  const go = (d: number) => onIndex((index! + d + items.length) % items.length);

  return (
    <div
      className="ng-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        startX.current = null;
      }}
    >
      <button ref={closeBtn} className="ng-lightbox-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <div className="ng-lightbox-stage" key={item.id}>
        {item.film ? (
          <figure className="ng-media" style={{ aspectRatio: item.ratio }}>
            {/* scrubbing the video mustn't count as a swipe to the next item */}
            <video
              src={`/api/film/${item.film}`}
              poster={item.photo?.src}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            />
          </figure>
        ) : (
          <MediaSlot kind={item.kind} seed={item.seed} ratio={item.ratio} photo={item.photo} video={item.video} brief={item.title} showBrief={false} />
        )}
      </div>
      <div className="ng-lightbox-bar">
        <button onClick={() => go(-1)} aria-label="Previous">
          ←
        </button>
        <div>
          <strong>{item.title}</strong>
          <span>
            {item.cat} · {index! + 1} / {items.length}
          </span>
        </div>
        <button onClick={() => go(1)} aria-label="Next">
          →
        </button>
      </div>
    </div>
  );
}
