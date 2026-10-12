import { Josefin_Sans, Jost, Limelight, Yellowtail } from "next/font/google";

export const limelight = Limelight({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-limelight" });
export const yellowtail = Yellowtail({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-yellowtail" });
export const jost = Jost({ subsets: ["latin"], display: "swap", variable: "--font-jost" });
export const josefin = Josefin_Sans({ subsets: ["latin"], display: "swap", variable: "--font-josefin", preload: false });

export const fontVariables = [limelight, yellowtail, jost, josefin].map((f) => f.variable).join(" ");
