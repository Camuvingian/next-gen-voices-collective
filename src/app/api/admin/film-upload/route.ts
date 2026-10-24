import { timingSafeEqual } from "node:crypto";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { FILM_PREFIX } from "@/lib/media";
import { blobConfigured } from "@/lib/server/blob";

const FILM_PATH = new RegExp(`^${FILM_PREFIX}[\\w-]{1,80}\\.mp4$`);

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * POST /api/admin/film-upload: lets the site's owner put a gallery film into
 * the Blob store (under films/, which the audition purge never touches),
 * uploading straight from their machine. Locked with CRON_SECRET as a bearer
 * token, so only someone holding the secret can use it.
 */
export async function POST(req: Request) {
  if (!authorised(req)) return new Response("Unauthorized", { status: 401 });
  if (!blobConfigured()) return Response.json({ error: "No Blob store" }, { status: 503 });
  const body = (await req.json()) as HandleUploadPresignedBody;
  const limits = { allowedContentTypes: ["video/mp4"], maximumSizeInBytes: 300_000_000 };
  try {
    const result = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        if (!FILM_PATH.test(pathname)) throw new Error("Not a film path");
        const token = await issueSignedToken({ pathname, operations: ["put"], validUntil: Date.now() + 60 * 60_000, ...limits });
        return { token, urlOptions: { ...limits, allowOverwrite: true } };
      },
    });
    return Response.json(result);
  } catch (err) {
    console.error("[film-upload]", err);
    return Response.json({ error: "The upload couldn't start" }, { status: 400 });
  }
}
