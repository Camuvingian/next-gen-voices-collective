import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Founder } from "@/views/Founder";

export const metadata: Metadata = pageMeta("Founder", "Bradley Barton-Young: singer-songwriter, recording artist, BRIT School vocal coach and founder of NextGen Voice Collective.", "/founder", { ownImage: true });

export default function Page() {
  return <Founder />;
}
