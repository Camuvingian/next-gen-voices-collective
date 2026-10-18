import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { About } from "@/views/About";

export const metadata: Metadata = pageMeta("About", "An audition-based ensemble for outstanding singers aged 13–18: who it's for, inside a Saturday rehearsal, and where we perform.", "/about");

export default function Page() {
  return <About />;
}
