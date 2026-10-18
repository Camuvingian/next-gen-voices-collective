import { head } from "@vercel/blob";
import { application, HONEYPOT } from "@/lib/forms";
import { receipt, team, type Video } from "@/lib/server/auditionEmails";
import { auditionsTo, EmailNotConfigured, sendEmail, siteUrl } from "@/lib/server/email";
import { limited } from "@/lib/server/rateLimit";
import { videoLink } from "@/lib/server/videoLink";

/**
 * POST /api/apply: an audition application from the Auditions page.
 * Checks it again, makes sure any uploaded video is really in the store, then
 * sends two emails (lib/server/auditionEmails.ts): the application to the team
 * with a CSV attached, and a receipt to the parent/guardian and the singer.
 */
export async function POST(req: Request) {
  if (limited(req, "apply", 5)) return Response.json({ error: "Too many applications from here. Try again in a few minutes." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "That didn't come through properly. Try again." }, { status: 400 });
  }
  // a bot filled the hidden field: pretend it worked
  if (body[HONEYPOT]) return Response.json({ ok: true });

  const r = application.safeParse(body);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const i of r.error.issues) fields[String(i.path[0])] ||= i.message;
    return Response.json({ error: "Some answers need another look.", fields }, { status: 422 });
  }
  const a = r.data;
  const site = siteUrl(req);
  const at = new Date();

  let video: Video = { url: a.link, uploaded: false };
  if (a.videoPath) {
    try {
      const blob = await head(a.videoPath);
      if (Date.now() - blob.uploadedAt.getTime() > 86_400_000) throw new Error("stale upload");
      video = { url: videoLink(site, blob.pathname), uploaded: true, sizeMb: Math.round(blob.size / 1e6) };
    } catch {
      return Response.json({ error: "We couldn't find the uploaded video. Upload it again, or paste a link instead." }, { status: 422 });
    }
  }

  // 1. to the team: every answer, plus the CSV; replies go to the parent/guardian
  const t = team(a, video, site, at);
  try {
    await sendEmail({ to: auditionsTo(), replyTo: a.gEmail, subject: t.subject, html: t.html, text: t.text, attachments: [t.csv] });
  } catch (err) {
    console.error("[apply] team email failed", err);
    const msg = err instanceof EmailNotConfigured ? "Applications aren't switched on yet." : "We couldn't send your application just now.";
    return Response.json({ error: `${msg} Please try again later, or email ${auditionsTo()}.` }, { status: 503 });
  }

  // 2. the receipt, to the parent/guardian and the singer; a courtesy, so the
  //    application still counts if it fails
  const to = [a.gEmail, a.singerEmail].filter((e, i, all) => e && all.findIndex((x) => x.toLowerCase() === e.toLowerCase()) === i);
  try {
    await sendEmail({ to, replyTo: auditionsTo(), ...receipt(a, video, site, at) });
  } catch (err) {
    console.error("[apply] receipt email failed", err);
  }

  return Response.json({ ok: true });
}
