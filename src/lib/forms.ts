import { z } from "zod";

/**
 * The audition and contact forms' rules, shared by the browser (step by step,
 * as the visitor fills them in) and the server (/api/apply, /api/contact),
 * which checks everything again before anything is sent.
 */

export function ageOn(dob: string, on = new Date()) {
  const d = new Date(dob);
  let a = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) a--;
  return a;
}

/** the largest audition video, in MB (the upload route enforces it too) */
export const VIDEO_MAX_MB = 500;
/** where audition videos live in the Blob store */
export const VIDEO_PREFIX = "auditions/";
/** the longest an audition video is kept, in days (the form's privacy notice says so) */
export const VIDEO_KEEP_DAYS = 14;
/** auditions/<random id>/<file name>: the id makes every path unguessable and unique */
export const VIDEO_PATH = /^auditions\/[a-f0-9-]{36}\/[\w.-]{1,80}$/;

/* ── Audition: one schema per step ── */
export const singer = z.object({
  firstName: z.string().trim().min(1, "Enter the singer's first name").max(80),
  lastName: z.string().trim().min(1, "Enter the singer's last name").max(80),
  dob: z
    .string()
    .min(1, "Enter a date of birth")
    .refine((v) => {
      const a = ageOn(v);
      return a >= 13 && a <= 18;
    }, "NextGen is for singers aged 13–18. Check the date, or get in touch if you're close to the range."),
  schoolYear: z.string().min(1, "Choose a school year").max(40),
  singerEmail: z.union([z.literal(""), z.string().email("That email doesn't look right").max(200)]),
});

export const guardian = z.object({
  gName: z.string().trim().min(1, "Enter a parent or guardian's name").max(120),
  gRelation: z.string().min(1, "Choose a relationship").max(40),
  gEmail: z.string().email("Enter an email we can reach you on").max(200),
  gPhone: z.string().regex(/^[+\d][\d\s()-]{8,}$/, "Enter a phone number, e.g. 07700 900123").max(30),
});

export const voice = z.object({
  voiceType: z.string().min(1, "Choose a voice type, or 'Not sure'").max(40),
  styles: z.array(z.string().max(40)).min(1, "Pick at least one style").max(12),
  experience: z.string().trim().min(20, "Tell us a little more (a sentence or two is plenty)").max(3000),
  why: z.string().trim().min(40, "Give us a few sentences, at least 40 characters").max(3000),
  available: z.literal(true, { error: "Confirm you can attend Saturday rehearsals" }),
});

const isLink = (v: string) => /^https?:\/\/\S+$/.test(v);

/** the last step, in the browser: a chosen file must have finished uploading */
export const video = z
  .object({
    videoPath: z.string(),
    uploading: z.literal(false, { error: "Wait for the video to finish uploading" }),
    link: z.string().max(500),
    song: z.string().trim().min(1, "Tell us what you're singing").max(200),
    consent: z.literal(true, { error: "A parent or guardian needs to confirm consent" }),
    privacy: z.literal(true, { error: "Accept the privacy notice to continue" }),
  })
  .refine((v) => v.videoPath || isLink(v.link), { message: "Upload a video or paste a link to one", path: ["file"] });

export const AUDITION_STEPS = [singer, guardian, voice, video];

/** everything the server receives from the audition form */
export const application = singer
  .extend(guardian.shape)
  .extend(voice.shape)
  .extend({
    videoPath: z.union([z.literal(""), z.string().regex(VIDEO_PATH)]),
    link: z.union([z.literal(""), z.string().refine(isLink, "That link doesn't look right")]),
    song: z.string().trim().min(1).max(200),
    heard: z.string().max(60),
    consent: z.literal(true),
    privacy: z.literal(true),
  })
  .refine((v) => v.videoPath || v.link, { message: "Upload a video or paste a link to one", path: ["file"] });
export type Application = z.infer<typeof application>;

/* ── Contact ── */
export const contactBase = z.object({
  kind: z.enum(["general", "booking", "auditions", "press"], { error: "Choose what your enquiry is about" }),
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().email("Enter an email we can reply to").max(200),
  phone: z.string().max(30),
  message: z.string().trim().min(10, "Add a short message so we know how to help").max(5000),
});
export const contactBooking = contactBase.extend({
  eventDate: z.string().min(1, "Add the event date (approximate is fine)").max(40),
  location: z.string().trim().min(1, "Add the venue or town").max(200),
  eventType: z.string().min(1, "Choose the type of event").max(60),
  audience: z.string().max(60),
});
export type ContactMessage = z.infer<typeof contactBase> & Partial<z.infer<typeof contactBooking>>;
export const contactSchemaFor = (kind: unknown) => (kind === "booking" ? contactBooking : contactBase);

/** the fields a person never sees: bots fill them in (both forms) */
export const HONEYPOT = "website";
