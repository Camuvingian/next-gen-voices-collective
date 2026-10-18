import type { Metadata } from "next";
import { SITE } from "./content";

/**
 * What link previews show (WhatsApp, iMessage, Slack, email, social): title,
 * description and image. The images are files beside the pages:
 * app/opengraph-image.jpg for the whole site, app/founder/opengraph-image.jpg
 * for the founder page.
 */
export const SITE_URL = process.env.SITE_URL || "https://www.nextgenvoices.live";

export const SITE_DESCRIPTION = "An elite, audition-based vocal ensemble for singers aged 13–18 in London. Young voices. One sound.";

export const OG_BASE = {
  type: "website",
  siteName: SITE.name,
  locale: "en_GB",
} as const;

/** the site-wide preview image; a page that sets its own preview text must name it
 *  again, or Next drops it (and naming it would override a page's own image file) */
const SITE_IMAGE = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "NextGen Voices neon sign over red sound waves: Young voices. One sound.",
};

/** a page's title and description, carried into its link preview; `ownImage` when
 *  the page has its own opengraph-image file beside it */
export function pageMeta(title: string, description: string, path: string, { ownImage = false } = {}): Metadata {
  // leave the key out entirely for a page with its own image file: even an empty one overrides it
  const images = ownImage ? {} : { images: [SITE_IMAGE] };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_BASE, title: `${title} · ${SITE.name}`, description, url: path, ...images },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE.name}`, description, ...images },
  };
}
