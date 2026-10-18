import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Auditions } from "@/views/Auditions";

export const metadata: Metadata = pageMeta("Auditions", "Apply to NextGen Voice Collective: a short form and a 1–3 minute video. For singers aged 13–18, rehearsing Saturdays in Richmond.", "/auditions");

export default function Page() {
  return <Auditions />;
}
