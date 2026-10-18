import { SITE, STEPS } from "@/lib/content";
import { ageOn, VIDEO_KEEP_DAYS, type Application } from "@/lib/forms";
import { esc, type Attachment } from "./email";
import { SIGN } from "./emailAssets";

/**
 * The two emails an audition application sends:
 *  - receipt(): to the parent/guardian and the singer, in the site's noir
 *    style (dark stage, neon sign, art-deco type), for the family to keep
 *  - team(): to Bradley, practical: every answer in plain, copyable text,
 *    one-tap actions, and the whole application attached as a CSV for Excel
 *
 * Email clients ignore most modern CSS, so both are table layouts with inline
 * styles. Web fonts load where the client allows (Apple Mail, iOS) and fall
 * back to close system fonts elsewhere (Gmail, Outlook).
 */

export type Video = { url: string; uploaded: boolean; sizeMb?: number };

const C = {
  stage: "#0b0b0b",
  card: "#141313",
  raised: "#1b1a19",
  line: "#2a2725",
  paper: "#f1efea",
  silver: "#b6b2aa",
  muted: "#8f8b85",
  neon: "#ff2e3f",
  neonText: "#ff5a66",
};
const F = {
  display: "'Limelight','Poiret One',Didot,'Bodoni 72',Georgia,serif",
  sans: "'Jost',Futura,'Century Gothic','Helvetica Neue',Arial,sans-serif",
  label: "'Josefin Sans',Futura,'Century Gothic','Helvetica Neue',Arial,sans-serif",
  script: "'Yellowtail','Brush Script MT','Segoe Script',cursive",
};
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Josefin+Sans:wght@500&family=Limelight&family=Yellowtail&display=swap" rel="stylesheet">`;

const longDate = (d: Date | string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
const stamp = (d: Date) => d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

/** hidden preview text shown next to the subject in the inbox */
const preheader = (s: string) =>
  `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(s)}${"&nbsp;&zwnj;".repeat(40)}</div>`;

function shell(title: string, body: string, opts: { bg: string; pre: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${esc(title)}</title>${FONTS}</head>
<body style="margin:0;padding:0;background:${opts.bg};-webkit-text-size-adjust:100%">${preheader(opts.pre)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${opts.bg}" style="background:${opts.bg}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">${body}</table>
</td></tr></table></body></html>`;
}

/* ── the receipt, for the family ── */

export function receipt(a: Application, video: Video, site: string, at = new Date()) {
  const first = a.firstName;
  const eyebrow = (t: string) =>
    `<p style="margin:0 0 14px;font:500 11px/1 ${F.label};letter-spacing:.28em;text-transform:uppercase;color:${C.neonText}">${esc(t)}</p>`;
  const rule = `<tr><td style="padding:0 40px"><div style="height:1px;line-height:1px;background:${C.line}">&nbsp;</div></td></tr>`;
  const summary = [
    ["Singer", `${a.firstName} ${a.lastName}`],
    ["Song", a.song],
    ["Video", video.uploaded ? "Uploaded and received" : "Link received"],
    ["Submitted", stamp(at)],
  ]
    .map(
      ([k, v], i) => `<tr>
<td style="padding:12px 0;${i ? `border-top:1px solid ${C.line};` : ""}font:500 11px/1.4 ${F.label};letter-spacing:.18em;text-transform:uppercase;color:${C.muted};width:120px;vertical-align:top">${esc(k)}</td>
<td style="padding:12px 0;${i ? `border-top:1px solid ${C.line};` : ""}font:400 16px/1.4 ${F.sans};color:${C.paper}">${esc(v)}</td></tr>`,
    )
    .join("");
  const steps = STEPS.slice(1)
    .map(
      (s, i) => `<tr>
<td style="padding:0 18px 22px 0;vertical-align:top;width:44px"><div style="width:40px;height:40px;border:1px solid ${C.neon};border-radius:50%;text-align:center;font:400 18px/40px ${F.display};color:${C.neonText}">${i + 2}</div></td>
<td style="padding:2px 0 22px;vertical-align:top"><p style="margin:0 0 4px;font:400 19px/1.2 ${F.display};color:${C.paper};letter-spacing:.03em">${esc(s.title)}</p><p style="margin:0;font:400 15px/1.55 ${F.sans};color:${C.silver}">${esc(s.body)}</p></td></tr>`,
    )
    .join("");

  const body = `
<tr><td align="center" bgcolor="${C.stage}" style="padding:8px 0 28px">
  <a href="${site}" style="text-decoration:none"><img src="cid:${SIGN.cid}" width="560" alt="NextGen Voices" style="display:block;width:100%;max-width:560px;height:auto;border:0;color:${C.neon};font:400 34px ${F.display}"></a>
</td></tr>
<tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-top:2px solid ${C.neon};border-radius:4px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:44px 40px 8px">
  ${eyebrow("Application received")}
  <h1 style="margin:0 0 20px;font:400 40px/1.08 ${F.display};color:${C.paper};letter-spacing:.02em">Thank you, <span style="font:400 46px/1 ${F.script};color:${C.neonText};text-shadow:0 0 14px rgba(255,46,63,.55)">${esc(first)}.</span></h1>
  <p style="margin:0 0 16px;font:400 17px/1.6 ${F.sans};color:${C.paper}">We’ve received ${esc(first)}’s application to ${esc(SITE.name)}, and it’s now with Bradley and the team.</p>
  <p style="margin:0 0 30px;font:400 16px/1.6 ${F.sans};color:${C.silver}">Every application is watched in full. We’re listening for voice, musicality and potential, not polish, so there’s nothing more to prepare for now.</p>
</td></tr>
<tr><td style="padding:0 40px 34px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.raised};border:1px solid ${C.line};border-radius:4px"><tr><td style="padding:10px 22px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${summary}</table>
  </td></tr></table>
</td></tr>
${rule}
<tr><td style="padding:34px 40px 14px">
  ${eyebrow("What happens next")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>
</td></tr>
${rule}
<tr><td style="padding:30px 40px 40px">
  <p style="margin:0 0 6px;font:400 15px/1.6 ${F.sans};color:${C.silver}">Rehearsals are ${esc(SITE.rehearsal.day)}, ${esc(SITE.rehearsal.time)}, at ${esc(SITE.rehearsal.venue)}. If anything in the application needs changing, just reply to this email.</p>
  <p style="margin:26px 0 0;font:400 32px/1 ${F.script};color:${C.paper}">Bradley</p>
  <p style="margin:6px 0 0;font:500 11px/1.4 ${F.label};letter-spacing:.2em;text-transform:uppercase;color:${C.muted}">Bradley Barton-Young · Founder</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px"><tr><td bgcolor="${C.neon}" style="border-radius:999px">
    <a href="${site}/about" style="display:inline-block;padding:14px 28px;font:500 12px/1 ${F.label};letter-spacing:.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:999px">Inside a rehearsal &rarr;</a>
  </td></tr></table>
</td></tr>
</table></td></tr>
<tr><td align="center" style="padding:30px 24px 0">
  <p style="margin:0 0 10px;font:400 18px/1 ${F.display};letter-spacing:.06em;color:${C.paper}">${esc(SITE.tagline)}</p>
  <p style="margin:0 0 14px;font:500 11px/1.8 ${F.label};letter-spacing:.2em;text-transform:uppercase;color:${C.muted}">
    <a href="${site}" style="color:${C.silver};text-decoration:none">${esc(SITE.name)}</a> &nbsp;·&nbsp; <a href="${SITE.instagram.url}" style="color:${C.silver};text-decoration:none">${esc(SITE.instagram.handle)}</a>
  </p>
  <p style="margin:0;font:400 12px/1.6 ${F.sans};color:${C.muted}">You’re receiving this because an audition application for ${esc(first)} was made on our website. If that wasn’t you, reply and let us know.</p>
</td></tr>`;

  // the sign travels inside the email, so it shows even where remote images are blocked
  const attachments: Attachment[] = [{ filename: SIGN.filename, base64: SIGN.base64, contentId: SIGN.cid }];

  return {
    attachments,
    subject: `Application received: ${first} · ${SITE.name}`,
    html: shell(`Application received`, body, { bg: C.stage, pre: `Thank you, ${first}. Here’s what happens next.` }),
    text: [
      `Thank you, ${first}.`,
      "",
      `We've received ${first}'s application to ${SITE.name}, and it's now with Bradley and the team.`,
      "",
      `Singer: ${a.firstName} ${a.lastName}`,
      `Song: ${a.song}`,
      `Video: ${video.uploaded ? "Uploaded and received" : "Link received"}`,
      `Submitted: ${stamp(at)}`,
      "",
      "What happens next",
      ...STEPS.slice(1).map((s, i) => `${i + 2}. ${s.title}: ${s.body}`),
      "",
      `Rehearsals are ${SITE.rehearsal.day}, ${SITE.rehearsal.time}, at ${SITE.rehearsal.venue}. If anything needs changing, just reply to this email.`,
      "",
      "Bradley Barton-Young, Founder",
      site,
    ].join("\n"),
  };
}

/* ── the team copy, for Bradley ── */

/** every answer, in one order, for the email and the CSV alike */
function fields(a: Application, video: Video, at: Date): [section: string, label: string, value: string][] {
  return [
    ["Singer", "First name", a.firstName],
    ["Singer", "Last name", a.lastName],
    ["Singer", "Date of birth", longDate(a.dob)],
    ["Singer", "Age", String(ageOn(a.dob, at))],
    ["Singer", "School year", a.schoolYear],
    ["Singer", "Singer email", a.singerEmail],
    ["Parent / guardian", "Guardian name", a.gName],
    ["Parent / guardian", "Relationship", a.gRelation],
    ["Parent / guardian", "Guardian email", a.gEmail],
    ["Parent / guardian", "Guardian phone", a.gPhone],
    ["Voice", "Voice type", a.voiceType],
    ["Voice", "Styles", a.styles.join(", ")],
    ["Voice", "Experience", a.experience],
    ["Voice", "Why NextGen", a.why],
    ["Voice", "Saturdays", "Can attend"],
    ["Audition", "Song", a.song],
    ["Audition", "Video", video.url],
    ["Audition", "Video source", video.uploaded ? `Uploaded${video.sizeMb ? `, ${video.sizeMb} MB` : ""} (private link)` : "Link from applicant"],
    ["Audition", "Heard about us", a.heard],
    ["Audition", "Consent", "Guardian consent and privacy notice confirmed"],
    ["Audition", "Submitted", stamp(at)],
  ];
}

export function team(a: Application, video: Video, site: string, at = new Date()) {
  const name = `${a.firstName} ${a.lastName}`;
  const age = ageOn(a.dob, at);
  const rows = fields(a, video, at);
  const tel = a.gPhone.replace(/[^\d+]/g, "");

  const btn = (href: string, label: string, solid = false) =>
    `<td style="padding:0 8px 8px 0"><a href="${esc(href)}" style="display:inline-block;padding:11px 18px;border-radius:999px;font:500 12px/1 ${F.label};letter-spacing:.14em;text-transform:uppercase;text-decoration:none;${solid ? `background:${C.neon};color:#fff;border:1px solid ${C.neon}` : `color:#111;border:1px solid #cfcac2`}">${esc(label)}</a></td>`;

  let section = "";
  const table = rows
    .map(([sec, k, v]) => {
      const head =
        sec !== section
          ? `<tr><td colspan="2" style="padding:${section ? "26px" : "6px"} 0 8px;font:500 11px/1 ${F.label};letter-spacing:.24em;text-transform:uppercase;color:#c4101f;border-bottom:2px solid #111">${esc(sec)}</td></tr>`
          : "";
      section = sec;
      const val =
        k === "Video" && v
          ? `<a href="${esc(v)}" style="color:#c4101f;word-break:break-all">${esc(v)}</a>`
          : k === "Guardian email" || k === "Singer email"
            ? v ? `<a href="mailto:${esc(v)}" style="color:#111">${esc(v)}</a>` : ""
            : nl2br(v);
      return `${head}<tr><td style="padding:9px 14px 9px 0;border-bottom:1px solid #e6e2db;font:500 12px/1.4 ${F.label};letter-spacing:.06em;color:#6d6963;width:150px;vertical-align:top">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #e6e2db;font:400 15px/1.5 Arial,Helvetica,sans-serif;color:#111;vertical-align:top">${val || "&mdash;"}</td></tr>`;
    })
    .join("");

  const body = `
<tr><td bgcolor="${C.stage}" style="background:${C.stage};padding:26px 32px 24px;border-radius:6px 6px 0 0;border-bottom:3px solid ${C.neon}">
  <p style="margin:0 0 10px;font:500 11px/1 ${F.label};letter-spacing:.3em;text-transform:uppercase;color:${C.neonText}">NextGen · New audition application</p>
  <h1 style="margin:0;font:400 30px/1.15 ${F.display};color:${C.paper};letter-spacing:.02em">${esc(name)}</h1>
  <p style="margin:8px 0 0;font:400 15px/1.5 ${F.sans};color:${C.silver}">Age ${age} · ${esc(a.voiceType)} · ${esc(a.schoolYear)} · singing “${esc(a.song)}”</p>
</td></tr>
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:24px 32px 30px;border-radius:0 0 6px 6px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    ${video.url ? btn(video.url, "▶ Watch audition", true) : ""}
    ${btn(`mailto:${a.gEmail}?subject=${encodeURIComponent(`NextGen audition: ${a.firstName}`)}`, `Email ${a.gName.split(" ")[0]}`)}
    ${tel ? btn(`tel:${tel}`, "Call") : ""}
  </tr></table>
  <p style="margin:10px 0 18px;font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#6d6963">Replying to this email goes to ${esc(a.gName)} (${esc(a.gEmail)}). The full application is attached as a CSV that opens in Excel.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${table}</table>
  ${video.uploaded ? `<p style="margin:22px 0 0;font:400 12px/1.5 Arial,Helvetica,sans-serif;color:#8a857e">The video link is private to this email, so please don’t forward it. Uploaded videos are deleted automatically after ${VIDEO_KEEP_DAYS} days, so download it if you want to keep it.</p>` : ""}
</td></tr>`;

  return {
    subject: `Audition application: ${name} (${age}, ${a.voiceType})`,
    html: shell(`Audition application: ${name}`, body, { bg: "#ece8e1", pre: `${name}, ${age}, ${a.voiceType}, singing ${a.song}` }),
    text: [`New audition application: ${name}`, "", ...rows.map(([, k, v]) => `${k}: ${v}`)].join("\n"),
    csv: { filename: csvName(a, at), content: toCsv(rows) },
  };
}

/* ── CSV ── */

/** quote every cell, and stop Excel reading answers as formulas */
const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

/** one header row and one row of answers, so applications can be pasted under each other in one sheet */
function toCsv(rows: [string, string, string][]) {
  const header = rows.map(([, k]) => k);
  const values = rows.map(([, , v]) => v);
  // the byte-order mark tells Excel it's UTF-8 (names with accents, curly quotes)
  return "﻿" + [header, values].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

function csvName(a: Application, at: Date) {
  const slug = (s: string) => s.normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `nextgen-application-${slug(a.lastName)}-${slug(a.firstName)}-${at.toISOString().slice(0, 10)}.csv`;
}
