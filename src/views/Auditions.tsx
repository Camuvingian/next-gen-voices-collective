"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/views/About";
import { Uploader } from "@/components/noir/Uploader";
import { Button, ButtonLink, Choice, Eyebrow, Field, Input, Reveal, Select, Textarea } from "@/components/noir/primitives";
import { ELIGIBILITY, SITE, STEPS } from "@/lib/content";
import { NeonSign } from "@/components/neon/NeonSign";

/* ── Schema ──────────────────────────────────────────────
   One zod schema per step. The same schemas validate on the server
   (Next.js route handler / server action) before anything is stored. */

function ageOn(dob: string, on = new Date()) {
  const d = new Date(dob);
  let a = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) a--;
  return a;
}

const singer = z.object({
  firstName: z.string().trim().min(1, "Enter the singer's first name"),
  lastName: z.string().trim().min(1, "Enter the singer's last name"),
  dob: z
    .string()
    .min(1, "Enter a date of birth")
    .refine((v) => {
      const a = ageOn(v);
      return a >= 13 && a <= 18;
    }, "NextGen is for singers aged 13–18. Check the date, or get in touch if you're close to the range."),
  schoolYear: z.string().min(1, "Choose a school year"),
  singerEmail: z.union([z.literal(""), z.string().email("That email doesn't look right")]),
});

const guardian = z.object({
  gName: z.string().trim().min(1, "Enter a parent or guardian's name"),
  gRelation: z.string().min(1, "Choose a relationship"),
  gEmail: z.string().email("Enter an email we can reach you on"),
  gPhone: z.string().regex(/^[+\d][\d\s()-]{8,}$/, "Enter a phone number, e.g. 07700 900123"),
});

const voice = z.object({
  voiceType: z.string().min(1, "Choose a voice type, or 'Not sure'"),
  styles: z.array(z.string()).min(1, "Pick at least one style"),
  experience: z.string().trim().min(20, "Tell us a little more (a sentence or two is plenty)"),
  why: z.string().trim().min(40, "Give us a few sentences, at least 40 characters"),
  available: z.literal(true, { error: "Confirm you can attend Saturday rehearsals" }),
});

const video = z
  .object({
    file: z.any(),
    link: z.string(),
    song: z.string().trim().min(1, "Tell us what you're singing"),
    consent: z.literal(true, { error: "A parent or guardian needs to confirm consent" }),
    privacy: z.literal(true, { error: "Accept the privacy notice to continue" }),
  })
  .refine((v) => v.file || /^https?:\/\/\S+$/.test(v.link), { message: "Upload a video or paste a link to one", path: ["file"] });

const SCHEMAS = [singer, guardian, voice, video];
const STEP_NAMES = ["Singer", "Parent / guardian", "Voice & experience", "Video & consent"];

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  schoolYear: string;
  singerEmail: string;
  gName: string;
  gRelation: string;
  gEmail: string;
  gPhone: string;
  voiceType: string;
  styles: string[];
  experience: string;
  why: string;
  available: boolean;
  file: File | null;
  link: string;
  song: string;
  heard: string;
  consent: boolean;
  privacy: boolean;
};

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  dob: "",
  schoolYear: "",
  singerEmail: "",
  gName: "",
  gRelation: "",
  gEmail: "",
  gPhone: "",
  voiceType: "",
  styles: [],
  experience: "",
  why: "",
  available: false,
  file: null,
  link: "",
  song: "",
  heard: "",
  consent: false,
  privacy: false,
};

const STYLES = ["Choral", "Musical theatre", "Pop / soul", "Classical", "Jazz", "Gospel", "Acapella"];

export function Auditions() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"editing" | "sending" | "sent">("editing");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  const validate = (i: number) => {
    const r = SCHEMAS[i].safeParse(data);
    if (r.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const issue of r.error.issues) {
      const k = String(issue.path[0]);
      if (!e[k]) e[k] = issue.message;
    }
    setErrors(e);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".ng-apply .has-error input, .ng-apply .has-error select, .ng-apply .has-error textarea")?.focus());
    return false;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((s) => s + 1);
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const submit = () => {
    if (!validate(3)) return;
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 1400);
  };

  const age = useMemo(() => (data.dob ? ageOn(data.dob) : null), [data.dob]);
  const e = errors;

  return (
    <>
      <PageHeader
        eyebrow="Auditions & applications"
        title="Your place in the"
        italic="Collective starts here."
        lede="We're looking for talented, committed singers aged 13 to 18. Applying is simple: fill in the form and upload a short video. Everything happens on this page."
      />

      {/* Eligibility + process */}
      <section className="ng-section ng-wrap ng-elig">
        <Reveal className="ng-elig-col">
          <Eyebrow>Who can apply</Eyebrow>
          <ul className="ng-ticks ng-ticks--lg">
            {ELIGIBILITY.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="ng-muted ng-small">
            Membership is {SITE.term.fee} per {SITE.term.length} (this varies with term length). There is no fee to apply or audition.
          </p>
        </Reveal>
        <Reveal className="ng-elig-col" delay={120}>
          <Eyebrow>What happens after you apply</Eyebrow>
          <ol className="ng-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="ng-step-n">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* Video tips */}
      <section className="ng-wrap">
        <Reveal className="ng-tips">
          <h2 className="ng-display">Filming your audition video</h2>
          <div className="ng-tips-grid">
            <p>
              <strong>One song, 1–3 minutes.</strong> Any style that shows your voice. Unaccompanied, with a backing track or with piano.
            </p>
            <p>
              <strong>Landscape, quiet room.</strong> Phone at eye level, face lit from the front, backing track lower than your voice.
            </p>
            <p>
              <strong>No editing needed.</strong> One straight take beats a polished edit. We’re listening for potential.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Form */}
      <section className="ng-section ng-wrap ng-apply" id="apply">
        <div className="ng-apply-card">
          {status === "sent" ? (
            <div className="ng-sent" role="status">
              <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" className="ng-sent-tick">
                <circle cx="32" cy="32" r="30" fill="none" stroke="var(--ng-accent)" strokeWidth="1.5" />
                <path d="M20 33l8 8 16-18" fill="none" stroke="var(--ng-fg)" strokeWidth="2" />
              </svg>
              <h2 className="ng-display ng-h2">
                Application received, <NeonSign>{`${data.firstName || "thank you"}.`}</NeonSign>
              </h2>
              <p className="ng-lead">
                A confirmation is on its way to {data.gEmail || "your email"}. Here’s what happens next.
              </p>
              <ol className="ng-steps ng-steps--compact">
                {STEPS.slice(1).map((s, i) => (
                  <li key={s.title}>
                    <span className="ng-step-n">{i + 2}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="ng-btn-row">
                <ButtonLink to="about" variant="outline">
                  Read about rehearsals
                </ButtonLink>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setData(INITIAL);
                    setStep(0);
                    setStatus("editing");
                  }}
                >
                  Start another application
                </Button>
              </div>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(ev) => {
                ev.preventDefault();
                step < 3 ? next() : submit();
              }}
            >
              <div className="ng-apply-head">
                <div>
                  <Eyebrow>Application form</Eyebrow>
                  <h2 className="ng-display ng-h3">{STEP_NAMES[step]}</h2>
                </div>
                <span className="ng-apply-count">
                  Step {step + 1} of {STEP_NAMES.length}
                </span>
              </div>
              <div className="ng-progress" aria-hidden="true">
                {STEP_NAMES.map((n, i) => (
                  <span key={n} className={i < step ? "is-done" : i === step ? "is-on" : ""}>
                    <i />
                    <em>{n}</em>
                  </span>
                ))}
              </div>

              <div className="ng-step-body" key={step}>
                {step === 0 && (
                  <div className="ng-grid2">
                    <Field id="firstName" label="First name" required error={e.firstName}>
                      <Input id="firstName" autoComplete="given-name" value={data.firstName} onChange={(x) => set("firstName", x.target.value)} />
                    </Field>
                    <Field id="lastName" label="Last name" required error={e.lastName}>
                      <Input id="lastName" autoComplete="family-name" value={data.lastName} onChange={(x) => set("lastName", x.target.value)} />
                    </Field>
                    <Field id="dob" label="Date of birth" required error={e.dob} hint={age !== null && age >= 0 ? `Age today: ${age}` : "Singers must be 13–18"}>
                      <Input id="dob" type="date" value={data.dob} onChange={(x) => set("dob", x.target.value)} />
                    </Field>
                    <Field id="schoolYear" label="School year" required error={e.schoolYear}>
                      <Select
                        id="schoolYear"
                        value={data.schoolYear}
                        onChange={(x) => set("schoolYear", x.target.value)}
                        options={["Year 8", "Year 9", "Year 10", "Year 11", "Year 12 / Lower Sixth", "Year 13 / Upper Sixth", "Left school"]}
                      />
                    </Field>
                    <Field id="singerEmail" label="Singer's email" error={e.singerEmail} hint="We copy singers in on rehearsal notes" className="ng-span2">
                      <Input id="singerEmail" type="email" autoComplete="email" value={data.singerEmail} onChange={(x) => set("singerEmail", x.target.value)} />
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="ng-grid2">
                    <p className="ng-muted ng-span2 ng-small">All NextGen singers are under 18, so we need a parent or guardian as the main contact.</p>
                    <Field id="gName" label="Full name" required error={e.gName}>
                      <Input id="gName" autoComplete="name" value={data.gName} onChange={(x) => set("gName", x.target.value)} />
                    </Field>
                    <Field id="gRelation" label="Relationship to singer" required error={e.gRelation}>
                      <Select id="gRelation" value={data.gRelation} onChange={(x) => set("gRelation", x.target.value)} options={["Parent", "Guardian", "Carer", "Other"]} />
                    </Field>
                    <Field id="gEmail" label="Email" required error={e.gEmail}>
                      <Input id="gEmail" type="email" autoComplete="email" value={data.gEmail} onChange={(x) => set("gEmail", x.target.value)} />
                    </Field>
                    <Field id="gPhone" label="Phone" required error={e.gPhone}>
                      <Input id="gPhone" type="tel" autoComplete="tel" value={data.gPhone} onChange={(x) => set("gPhone", x.target.value)} />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="ng-stack">
                    <Field id="voiceType" label="Voice type" required error={e.voiceType}>
                      <Choice
                        name="voiceType"
                        value={data.voiceType}
                        onChange={(v) => set("voiceType", v)}
                        columns={3}
                        options={[
                          { value: "Soprano", label: "Soprano" },
                          { value: "Alto", label: "Alto" },
                          { value: "Tenor", label: "Tenor" },
                          { value: "Baritone / Bass", label: "Baritone / Bass" },
                          { value: "Changing", label: "Voice changing" },
                          { value: "Not sure", label: "Not sure" },
                        ]}
                      />
                    </Field>
                    <Field id="styles" label="Styles you sing" required error={e.styles}>
                      <div className="ng-chips" id="styles">
                        {STYLES.map((s) => {
                          const on = data.styles.includes(s);
                          return (
                            <button
                              type="button"
                              key={s}
                              aria-pressed={on}
                              className={on ? "is-on" : ""}
                              onClick={() => set("styles", on ? data.styles.filter((x) => x !== s) : [...data.styles, s])}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                    <Field id="experience" label="Singing experience" required error={e.experience} hint="Lessons, grades, choirs, shows, anything relevant">
                      <Textarea id="experience" rows={3} value={data.experience} onChange={(x) => set("experience", x.target.value)} />
                    </Field>
                    <Field id="why" label="Why do you want to join NextGen?" required error={e.why} hint={`${data.why.trim().length} characters`}>
                      <Textarea id="why" rows={4} value={data.why} onChange={(x) => set("why", x.target.value)} />
                    </Field>
                    <label className={["ng-check", e.available && "has-error"].filter(Boolean).join(" ")}>
                      <input id="available" type="checkbox" checked={data.available} onChange={(x) => set("available", x.target.checked)} />
                      <span>
                        I can attend rehearsals on {SITE.rehearsal.day}, {SITE.rehearsal.time}, for the full term.
                      </span>
                    </label>
                    {e.available && <p className="ng-error">{e.available}</p>}
                  </div>
                )}

                {step === 3 && (
                  <div className="ng-stack">
                    <Field id="file" label="Audition video" required error={undefined}>
                      <Uploader id="file" file={data.file} onFile={(f) => set("file", f)} error={e.file} />
                    </Field>
                    <Field id="link" label="Or paste a link" hint="YouTube (unlisted), Google Drive or Dropbox. Make sure it's viewable.">
                      <Input id="link" type="url" placeholder="https://" value={data.link} onChange={(x) => set("link", x.target.value)} />
                    </Field>
                    <div className="ng-grid2">
                      <Field id="song" label="Song and artist" required error={e.song}>
                        <Input id="song" value={data.song} onChange={(x) => set("song", x.target.value)} />
                      </Field>
                      <Field id="heard" label="How did you hear about us?">
                        <Select
                          id="heard"
                          value={data.heard}
                          onChange={(x) => set("heard", x.target.value)}
                          options={["Instagram", "Friend or member", "School / teacher", "Bradley Vocal Coach", "Saw a performance", "Search", "Other"]}
                        />
                      </Field>
                    </div>
                    <label className={["ng-check", e.consent && "has-error"].filter(Boolean).join(" ")}>
                      <input id="consent" type="checkbox" checked={data.consent} onChange={(x) => set("consent", x.target.checked)} />
                      <span>I’m the singer’s parent or guardian and I consent to this application and video being reviewed by the NextGen team.</span>
                    </label>
                    {e.consent && <p className="ng-error">{e.consent}</p>}
                    <label className={["ng-check", e.privacy && "has-error"].filter(Boolean).join(" ")}>
                      <input id="privacy" type="checkbox" checked={data.privacy} onChange={(x) => set("privacy", x.target.checked)} />
                      <span>I’ve read the privacy notice. Videos are stored securely, used only for this audition and deleted after 6 months.</span>
                    </label>
                    {e.privacy && <p className="ng-error">{e.privacy}</p>}
                  </div>
                )}
              </div>

              <div className="ng-apply-actions">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={back}>
                    ← Back
                  </Button>
                ) : (
                  <span className="ng-hint">Takes about 10 minutes</span>
                )}
                <Button type="submit" size="lg" disabled={status === "sending"}>
                  {step < 3 ? `Continue to ${STEP_NAMES[step + 1].toLowerCase()}` : status === "sending" ? "Sending…" : "Submit application"}
                </Button>
              </div>
            </form>
          )}
        </div>
        <aside className="ng-apply-aside">
          <h3>Questions before you apply?</h3>
          <p className="ng-muted">Parents and singers are welcome to get in touch first. We usually reply within two working days.</p>
          <ButtonLink to="contact" variant="link">
            Contact the team
          </ButtonLink>
        </aside>
      </section>
    </>
  );
}
