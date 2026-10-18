import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { VIDEO_MAX_MB, VIDEO_PATH } from "@/lib/forms";
import { blobConfigured } from "@/lib/server/blob";
import { limited } from "@/lib/server/rateLimit";

/**
 * POST /api/audition-video: lets the browser upload an audition video
 * straight to the private Blob store (big phone videos never pass through this
 * server). This route only hands out a short-lived, presigned permission to
 * write one video file at one path under auditions/, up to the size limit.
 */
export async function POST(req: Request) {
  if (!blobConfigured()) return Response.json({ error: "Video upload isn't switched on yet. Paste a link to your video instead." }, { status: 503 });
  let body: HandleUploadPresignedBody;
  try {
    body = (await req.json()) as HandleUploadPresignedBody;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (limited(req, "video", 8)) return Response.json({ error: "Too many uploads from here. Try again in a few minutes." }, { status: 429 });

  const limits = { allowedContentTypes: ["video/*"], maximumSizeInBytes: VIDEO_MAX_MB * 1_000_000 };
  try {
    const result = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        if (!VIDEO_PATH.test(pathname)) throw new Error("Not an audition video path");
        const token = await issueSignedToken({ pathname, operations: ["put"], validUntil: Date.now() + 60 * 60_000, ...limits });
        return { token, urlOptions: { ...limits, allowOverwrite: false } };
      },
    });
    return Response.json(result);
  } catch (err) {
    console.error("[audition-video]", err);
    return Response.json({ error: "The upload couldn't start. Try again, or paste a link instead." }, { status: 400 });
  }
}
