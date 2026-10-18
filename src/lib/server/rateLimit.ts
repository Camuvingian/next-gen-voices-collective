/**
 * A small per-visitor limit on form posts: a fixed window per IP address.
 * It lives in the server's memory, so on Vercel each running instance counts
 * on its own; that's enough to stop a script hammering the forms.
 */
const hits = new Map<string, { n: number; until: number }>();

export function limited(req: Request, key: string, max = 5, windowMs = 10 * 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const h = hits.get(id);
  if (!h || h.until < now) {
    hits.set(id, { n: 1, until: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.until < now) hits.delete(k);
    return false;
  }
  h.n++;
  return h.n > max;
}
