"use client";

import { useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/views/About";
import { InstagramGlyph } from "@/components/noir/Chrome";
import { Button, Choice, Eyebrow, Field, Input, Reveal, Select, Textarea } from "@/components/noir/primitives";
import { SITE } from "@/lib/content";
import { NeonSign } from "@/components/neon/NeonSign";

type Kind = "general" | "booking" | "auditions" | "press";

const base = z.object({
  kind: z.enum(["general", "booking", "auditions", "press"], { error: "Choose what your enquiry is about" }),
  name: z.string().trim().min(1, "Enter your name"),
  email: z.string().email("Enter an email we can reply to"),
  phone: z.string(),
  message: z.string().trim().min(10, "Add a short message so we know how to help"),
});
const booking = base.extend({
  eventDate: z.string().min(1, "Add the event date (approximate is fine)"),
  location: z.string().trim().min(1, "Add the venue or town"),
  eventType: z.string().min(1, "Choose the type of event"),
  audience: z.string(),
});

const EMPTY = { kind: "" as Kind | "", name: "", email: "", phone: "", message: "", eventDate: "", location: "", eventType: "", audience: "" };

export function Contact() {
  const [d, setD] = useState(EMPTY);
  const [e, setE] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof EMPTY, v: string) => {
    setD((x) => ({ ...x, [k]: v }));
    if (e[k]) setE((x) => ({ ...x, [k]: "" }));
  };

  const submit = () => {
    const r = (d.kind === "booking" ? booking : base).safeParse(d);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0])] ||= i.message));
      setE(errs);
      return;
    }
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 1200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const el = document.getElementById("ng-email-text");
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch, or"
        italic="book the Collective."
        lede="General questions, audition queries and performance bookings all come through here. We reply within two working days."
      />
      <section className="ng-section ng-wrap ng-contact">
        <Reveal className="ng-contact-form">
          {status === "sent" ? (
            <div className="ng-sent" role="status">
              <h2 className="ng-display ng-h2">
                Message sent. <NeonSign>{`Thank you, ${d.name.split(" ")[0]}.`}</NeonSign>
              </h2>
              <p className="ng-lead">
                {d.kind === "booking"
                  ? `We'll check the Collective's availability for ${d.eventDate ? new Date(d.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "your date"} and come back to you with options.`
                  : "We'll reply to " + d.email + " within two working days."}
              </p>
              <Button variant="outline" onClick={() => (setD(EMPTY), setStatus("idle"))}>
                Send another message
              </Button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(ev) => {
                ev.preventDefault();
                submit();
              }}
              className="ng-stack"
            >
              <Field id="kind" label="What's it about?" required error={e.kind}>
                <Choice<Kind>
                  name="kind"
                  value={d.kind}
                  onChange={(v) => set("kind", v)}
                  options={[
                    { value: "booking", label: "Book a performance", detail: "Events, concerts, private bookings" },
                    { value: "auditions", label: "Auditions", detail: "Joining NextGen" },
                    { value: "general", label: "General enquiry", detail: "Anything else" },
                    { value: "press", label: "Press & partnerships", detail: "Media, schools, collaborations" },
                  ]}
                />
              </Field>

              <div className={["ng-reveal-fields", d.kind === "booking" && "is-open"].filter(Boolean).join(" ")} aria-hidden={d.kind !== "booking"}>
                <div className="ng-reveal-fields-inner">
                  <div className="ng-booking">
                    <p className="ng-eyebrow">Event details</p>
                    <div className="ng-grid2">
                      <Field id="eventDate" label="Event date" required error={e.eventDate}>
                        <Input id="eventDate" type="date" value={d.eventDate} onChange={(x) => set("eventDate", x.target.value)} tabIndex={d.kind === "booking" ? 0 : -1} />
                      </Field>
                      <Field id="eventType" label="Type of event" required error={e.eventType}>
                        <Select
                          id="eventType"
                          value={d.eventType}
                          onChange={(x) => set("eventType", x.target.value)}
                          tabIndex={d.kind === "booking" ? 0 : -1}
                          options={["Concert or festival", "Corporate event", "Charity or fundraiser", "Wedding or private party", "School or community event", "Recording or filming", "Other"]}
                        />
                      </Field>
                      <Field id="location" label="Location" required error={e.location} hint="Venue name or town">
                        <Input id="location" value={d.location} onChange={(x) => set("location", x.target.value)} tabIndex={d.kind === "booking" ? 0 : -1} />
                      </Field>
                      <Field id="audience" label="Expected audience">
                        <Select
                          id="audience"
                          value={d.audience}
                          onChange={(x) => set("audience", x.target.value)}
                          tabIndex={d.kind === "booking" ? 0 : -1}
                          options={["Under 50", "50–150", "150–500", "500+"]}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ng-grid2">
                <Field id="name" label="Your name" required error={e.name}>
                  <Input id="name" autoComplete="name" value={d.name} onChange={(x) => set("name", x.target.value)} />
                </Field>
                <Field id="email" label="Email" required error={e.email}>
                  <Input id="email" type="email" autoComplete="email" value={d.email} onChange={(x) => set("email", x.target.value)} />
                </Field>
                <Field id="phone" label="Phone" className="ng-span2">
                  <Input id="phone" type="tel" autoComplete="tel" value={d.phone} onChange={(x) => set("phone", x.target.value)} />
                </Field>
              </div>
              <Field id="message" label="Message" required error={e.message}>
                <Textarea
                  id="message"
                  rows={5}
                  value={d.message}
                  onChange={(x) => set("message", x.target.value)}
                  placeholder={d.kind === "booking" ? "Tell us about the event, timings and what you'd like the Collective to perform." : ""}
                />
              </Field>
              <div className="ng-apply-actions">
                <span className="ng-hint">We never share your details.</span>
                <Button type="submit" size="lg" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : d.kind === "booking" ? "Send booking enquiry" : "Send message"}
                </Button>
              </div>
            </form>
          )}
        </Reveal>

        <Reveal className="ng-contact-aside" delay={120}>
          <div className="ng-contact-block">
            <Eyebrow>Email</Eyebrow>
            <p className="ng-contact-big" id="ng-email-text">
              {SITE.email}
            </p>
            <button type="button" className="ng-btn ng-btn--ghost ng-btn--sm" onClick={copy}>
              <span className="ng-btn-label">{copied ? "Copied" : "Copy address"}</span>
            </button>
          </div>
          <div className="ng-contact-block">
            <Eyebrow>Rehearsals</Eyebrow>
            <p>
              {SITE.rehearsal.day}, {SITE.rehearsal.time}
              <br />
              {SITE.rehearsal.venue}
            </p>
            <p className="ng-hint">Visits by arrangement only, please contact us first.</p>
          </div>
          <div className="ng-contact-block">
            <Eyebrow>Instagram</Eyebrow>
            <a href={SITE.instagram.url} target="_blank" rel="noreferrer" className="ng-ig-link ng-contact-big">
              <InstagramGlyph size={22} /> {SITE.instagram.handle}
            </a>
            <p className="ng-hint">DMs open. The quickest way to see what we’re up to this week.</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
