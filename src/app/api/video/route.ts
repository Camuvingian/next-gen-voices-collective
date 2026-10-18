import { issueSignedToken, presignUrl } from "@vercel/blob";
import { VIDEO_PATH } from "@/lib/forms";
import { verifyVideoLink } from "@/lib/server/videoLink";

/**
 * GET /api/video?p=<path>&e=<expiry>&s=<signature>: opens a private audition
 * video for whoever holds the signed link from the application email. It
 * forwards to a presigned Blob address that works for one hour, so the video
 * streams (and scrubs) straight from storage, not through this server.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("p") ?? "";
  const exp = Number(url.searchParams.get("e"));
  const sig = url.searchParams.get("s") ?? "";
  if (!VIDEO_PATH.test(path) || !verifyVideoLink(path, exp, sig)) {
    return new Response("This video link has expired or isn't valid. Audition videos are kept for 14 days.", { status: 404 });
  }
  try {
    const token = await issueSignedToken({ pathname: path, operations: ["get"], validUntil: Date.now() + 60 * 60_000 });
    const { presignedUrl } = await presignUrl(token, { operation: "get", pathname: path, access: "private" });
    return new Response(null, { status: 302, headers: { Location: presignedUrl, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
  } catch (err) {
    console.error("[video]", err);
    return new Response("This video is no longer available.", { status: 404 });
  }
}
