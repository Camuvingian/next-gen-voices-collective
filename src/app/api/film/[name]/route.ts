import { connection } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { FILMS } from "@/lib/media";

/**
 * GET /api/film/<name>: plays one of the gallery films (FILMS in lib/media.ts).
 * The films sit in the private Blob store, so this forwards to a presigned
 * address that works for an hour; the video streams and scrubs straight from
 * storage, not through this server.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/film/[name]">) {
  await connection();
  const { name } = await ctx.params;
  const film = Object.hasOwn(FILMS, name) ? FILMS[name as keyof typeof FILMS] : null;
  if (!film) return new Response("Not found", { status: 404 });
  try {
    const token = await issueSignedToken({ pathname: film.path, operations: ["get"], validUntil: Date.now() + 60 * 60_000 });
    const { presignedUrl } = await presignUrl(token, { operation: "get", pathname: film.path, access: "private" });
    // a browser may reuse the address for a while: it stays valid for the hour
    return new Response(null, { status: 302, headers: { Location: presignedUrl, "Cache-Control": "private, max-age=600" } });
  } catch (err) {
    console.error("[film]", err);
    return new Response("This film isn't available right now.", { status: 503 });
  }
}
