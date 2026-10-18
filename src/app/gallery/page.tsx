import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Gallery } from "@/views/Gallery";

export const metadata: Metadata = pageMeta("Gallery", "Rehearsals, performances and behind the scenes with NextGen Voice Collective.", "/gallery");

export default function Page() {
  return <Gallery />;
}
