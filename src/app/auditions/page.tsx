import type { Metadata } from "next";
import { Auditions } from "@/views/Auditions";

export const metadata: Metadata = { title: "Auditions" };

export default function Page() {
  return <Auditions />;
}
