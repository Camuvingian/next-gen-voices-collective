/**
 * Sends email through Resend's HTTP API (no SDK needed).
 *
 * Environment (set in Vercel → Settings → Environment Variables, and in
 * .env.local to send from `next dev`):
 *   RESEND_API_KEY  the API key from resend.com
 *   EMAIL_FROM      the sender, on the domain verified in Resend,
 *                   e.g. "NextGen Voice Collective <applications@nextgenvoices.live>"
 *   AUDITIONS_TO    where applications go   (default bradley@bradleyvocalcoach.com)
 *   CONTACT_TO      where enquiries go      (default the same)
 *   SITE_URL        the public address used for links and images in emails,
 *                   e.g. https://www.nextgenvoices.live (default: the address the form was sent from)
 */
export const DEFAULT_TO = "bradley@bradleyvocalcoach.com";
export const auditionsTo = () => process.env.AUDITIONS_TO || DEFAULT_TO;
export const contactTo = () => process.env.CONTACT_TO || DEFAULT_TO;

type Email = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string; attachments?: Attachment[] };

/** text content (e.g. a CSV), or base64 bytes; an image with a contentId shows inline where the HTML says src="cid:<contentId>" */
export type Attachment = { filename: string; content?: string; base64?: string; contentId?: string };

/** links and images in emails must point at the public site, not localhost */
export const siteUrl = (req: Request) => (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");

export class EmailNotConfigured extends Error {}

export async function sendEmail({ to, subject, html, text, replyTo, attachments }: Email) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new EmailNotConfigured("RESEND_API_KEY and EMAIL_FROM must be set to send email");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      // Resend takes attachment content as base64
      ...(attachments?.length
        ? {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: a.base64 ?? Buffer.from(a.content ?? "", "utf8").toString("base64"),
              ...(a.contentId ? { content_id: a.contentId } : {}),
            })),
          }
        : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend refused the email (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as { id: string };
}

/* ── building the messages ── */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type Row = [label: string, value: string, opts?: { href?: string }];

/** a plain, readable table email that works in every mail client */
export function layout(title: string, intro: string, rows: Row[], outro = "") {
  const cells = rows
    .filter(([, v]) => v)
    .map(([k, v, o]) => {
      const val = o?.href ? `<a href="${esc(o.href)}" style="color:#d1112b">${esc(v)}</a>` : esc(v).replace(/\n/g, "<br>");
      return `<tr><td style="padding:8px 16px 8px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;color:#111">${val}</td></tr>`;
    })
    .join("");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f1ea;font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 32px">
<h1 style="margin:0 0 8px;font-size:20px;color:#111">${esc(title)}</h1>
<p style="margin:0 0 20px;color:#444">${esc(intro)}</p>
${cells ? `<table style="border-collapse:collapse;width:100%">${cells}</table>` : ""}
${outro ? `<p style="margin:20px 0 0;color:#444">${esc(outro)}</p>` : ""}
</div></body></html>`;
  const text = [title, "", intro, "", ...rows.filter(([, v]) => v).map(([k, v, o]) => `${k}: ${o?.href ?? v}`), outro ? `\n${outro}` : ""].join("\n");
  return { html, text };
}
