import { createHmac, timingSafeEqual } from "node:crypto";
import { VIDEO_KEEP_DAYS } from "@/lib/forms";

/**
 * Audition videos are private in the Blob store. The email to the team links
 * to /api/video with the video's path, an expiry and a signature, so only that
 * link (not a guess at the path) can open it, and only while the video is kept.
 * Signed with VIDEO_LINK_SECRET, or CRON_SECRET when that isn't set.
 */
function secret() {
  return process.env.VIDEO_LINK_SECRET || process.env.CRON_SECRET || "";
}

const sign = (path: string, exp: number) => createHmac("sha256", secret()).update(`video:${path}:${exp}`).digest("base64url");

export function videoLink(origin: string, path: string) {
  if (!secret()) throw new Error("VIDEO_LINK_SECRET or CRON_SECRET must be set");
  const exp = Date.now() + VIDEO_KEEP_DAYS * 86_400_000;
  return `${origin}/api/video?p=${encodeURIComponent(path)}&e=${exp}&s=${sign(path, exp)}`;
}

export function verifyVideoLink(path: string, exp: number, sig: string) {
  if (!secret() || !Number.isFinite(exp) || exp < Date.now()) return false;
  const want = Buffer.from(sign(path, exp));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
