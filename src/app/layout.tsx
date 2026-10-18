import type { Metadata } from "next";
import { NeonBootScript } from "@/components/neon/NeonBootScript";
import { Shell } from "@/components/noir/Shell";
import { SITE } from "@/lib/content";
import { OG_BASE, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  // link previews (WhatsApp, iMessage, email…): the image is app/opengraph-image.jpg
  openGraph: { ...OG_BASE, title: `${SITE.name}: ${SITE.tagline}`, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: `${SITE.name}: ${SITE.tagline}`, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // the boot script sets the saved neon colour/power on <html> before React hydrates
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <NeonBootScript />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
