"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/views/About";
import { MediaSlot } from "@/components/noir/MediaSlot";
import { Lightbox } from "@/components/noir/Lightbox";
import { InstagramGlyph } from "@/components/noir/Chrome";
import { GALLERY, SITE, type GalleryItem } from "@/lib/content";

const FILTERS = ["All", "Performances", "Rehearsals", "Behind the scenes", "Video"] as const;
type Filter = (typeof FILTERS)[number];

export function Gallery() {
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<number | null>(null);

  const items = useMemo<GalleryItem[]>(
    () => GALLERY.filter((g) => (filter === "All" ? true : filter === "Video" ? g.video : g.cat === filter)),
    [filter],
  );

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="The Collective,"
        italic="on and off stage."
        lede="Performances, Saturday rehearsals and the moments in between. Tap any photo or film to view it full screen."
      />
      <section className="ng-wrap ng-gallery">
        <div className="ng-filters" role="tablist" aria-label="Filter gallery">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? "is-on" : ""} onClick={() => setFilter(f)}>
              {f}
              <span className="ng-filter-count">
                {f === "All" ? GALLERY.length : f === "Video" ? GALLERY.filter((g) => g.video).length : GALLERY.filter((g) => g.cat === f).length}
              </span>
            </button>
          ))}
        </div>
        <div className="ng-masonry" key={filter}>
          {items.map((g, i) => (
            <button key={g.id} className="ng-masonry-item" style={{ animationDelay: `${i * 45}ms` }} onClick={() => setOpen(i)} aria-label={`Open ${g.title}`}>
              <MediaSlot kind={g.kind} seed={g.seed} ratio={g.ratio} photo={g.photo} video={g.video} brief={g.title} showBrief={false} />
              <span className="ng-masonry-cap">
                <strong>{g.title}</strong>
                <span>{g.cat}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="ng-gallery-more">
          <p className="ng-muted">More from rehearsals every week on Instagram.</p>
          <a className="ng-btn ng-btn--outline" href={SITE.instagram.url} target="_blank" rel="noreferrer">
            <InstagramGlyph />
            <span className="ng-btn-label">{SITE.instagram.handle}</span>
          </a>
        </div>
      </section>
      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}
