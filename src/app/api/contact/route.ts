import { contactSchemaFor, HONEYPOT } from "@/lib/forms";
import { contactTo, EmailNotConfigured, layout, sendEmail } from "@/lib/server/email";
import { limited } from "@/lib/server/rateLimit";

const KINDS: Record<string, string> = { general: "General enquiry", booking: "Booking enquiry", auditions: "Audition question", press: "Press enquiry" };

/** POST /api/contact: the Contact page form, emailed to the team with replies going to the sender. */
export async function POST(req: Request) {
  if (limited(req, "contact", 6)) return Response.json({ error: "Too many messages from here. Try again in a few minutes." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "That didn't come through properly. Try again." }, { status: 400 });
  }
  if (body[HONEYPOT]) return Response.json({ ok: true });

  const r = contactSchemaFor(body.kind).safeParse(body);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const i of r.error.issues) fields[String(i.path[0])] ||= i.message;
    return Response.json({ error: "Some answers need another look.", fields }, { status: 422 });
  }
  const m = r.data as Record<string, string>;
  const kind = KINDS[m.kind];
  const mail = layout(`${kind} from ${m.name}`, `Reply to this email to answer ${m.name}.`, [
    ["Name", m.name],
    ["Email", m.email, { href: `mailto:${m.email}` }],
    ["Phone", m.phone],
    ["Event date", m.eventDate ?? ""],
    ["Type of event", m.eventType ?? ""],
    ["Location", m.location ?? ""],
    ["Audience", m.audience ?? ""],
    ["Message", m.message],
  ]);

  try {
    await sendEmail({ to: contactTo(), replyTo: m.email, subject: `${kind}: ${m.name}`, ...mail });
  } catch (err) {
    console.error("[contact] email failed", err);
    const msg = err instanceof EmailNotConfigured ? "Messages aren't switched on yet." : "We couldn't send your message just now.";
    return Response.json({ error: `${msg} Please try again later, or email ${contactTo()}.` }, { status: 503 });
  }
  return Response.json({ ok: true });
}
