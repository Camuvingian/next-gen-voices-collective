import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Contact } from "@/views/Contact";

export const metadata: Metadata = pageMeta("Contact", "Questions, audition queries and performance bookings for NextGen Voice Collective. We reply within two working days.", "/contact");

export default function Page() {
  return <Contact />;
}
