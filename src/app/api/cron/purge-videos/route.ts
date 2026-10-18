import { del, list } from "@vercel/blob";
import { VIDEO_KEEP_DAYS, VIDEO_PREFIX } from "@/lib/forms";
import { blobConfigured } from "@/lib/server/blob";

/**
 * GET /api/cron/purge-videos: deletes audition videos so none is kept longer
 * than VIDEO_KEEP_DAYS (14). Vercel Cron calls it once a day (vercel.json),
 * sending CRON_SECRET as a bearer token, so it deletes anything a day short of
 * the limit: nothing outlives 14 days.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!blobConfigured()) return Response.json({ deleted: 0, note: "no Blob store" });

  const cutoff = Date.now() - (VIDEO_KEEP_DAYS - 1) * 86_400_000;
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const page = await list({ prefix: VIDEO_PREFIX, cursor, limit: 1000 });
    const old = page.blobs.filter((b) => b.uploadedAt.getTime() < cutoff).map((b) => b.url);
    if (old.length) {
      await del(old);
      deleted += old.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return Response.json({ deleted });
}
