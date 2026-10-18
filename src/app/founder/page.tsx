import type { Metadata } from "next";
import { Founder } from "@/views/Founder";

export const metadata: Metadata = { title: "Founder" };

export default function Page() {
  return <Founder />;
}
