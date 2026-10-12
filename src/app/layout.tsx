import type { Metadata } from "next";
import { Shell } from "@/components/noir/Shell";
import { SITE } from "@/lib/content";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: "An elite, audition-based vocal ensemble for singers aged 13–18 in London. Young voices. One sound.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={fontVariables}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
