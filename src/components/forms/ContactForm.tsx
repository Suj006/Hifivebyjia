"use client";

import { useId, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Nainu } from "@/components/brand/Nainu";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { submitContact } from "@/lib/repositories";
import { hasErrors, validateContact, type ContactInput, type FieldErrors } from "@/lib/validation";
import { mailtoLink } from "@/lib/whatsapp";

export function ContactForm() {
  const id = useId();
  const [form, setForm] = useState<ContactInput>({ name: "", email: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors<keyof ContactInput>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "saved">("idle");
  const [serverError, setServerError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateContact(form);
    setErrors(errs);
    if (hasErrors(errs)) {
      document.getElementById(`${id}-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setStatus("sending");
    setServerError("");
    const res = await submitContact({ ...form, website: honeypot });
    if (!res.ok) {
      setStatus("idle");
      setServerError(res.error ?? "Something went wrong.");
      return;
    }
    track("contact");
    setStatus(res.delivered ? "sent" : "saved");
  }

  if (status === "sent" || status === "saved") {
    return (
      <div className="card flex flex-col items-center p-8 text-center" role="status">
        <div className="w-32">
          <Nainu mood="celebrate" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">Thanks, {form.name.split(" ")[0]}! ✋</h2>
        {status === "sent" ? (
          <p className="mt-2 text-ink-soft">We got your message and will reply to {form.email} soon.</p>
        ) : (
          <>
            <p className="mt-2 text-ink-soft">To make sure your message reaches us, please send it from your email app too.</p>
            <a href={mailtoLink(`Message from ${form.name}`, form.message)} className="btn btn-primary mt-5">
              Open email app
            </a>
          </>
        )}
      </div>
    );
  }

  const field = (k: keyof ContactInput) => ({
    id: `${id}-${k}`,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    },
    "aria-invalid": Boolean(errors[k]),
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="font-display text-2xl font-bold">
        Send us a message
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="label">Your name *</label>
          <input {...field("name")} className="input" autoComplete="name" maxLength={80} />
          {errors.name && <p id={`${id}-name-err`} className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="label">Email *</label>
          <input {...field("email")} type="email" inputMode="email" className="input" autoComplete="email" maxLength={120} />
          {errors.email && <p id={`${id}-email-err`} className="field-error">{errors.email}</p>}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="label">Message *</label>
        <textarea {...field("message")} className="input min-h-40" maxLength={2000} placeholder="Custom order idea, question, collaboration… we’d love to hear it!" />
        {errors.message && <p id={`${id}-message-err`} className="field-error">{errors.message}</p>}
      </div>
      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {serverError && <p className="field-error" role="alert">{serverError}</p>}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === "sending"}>
        <Send className="h-5 w-5" aria-hidden /> {status === "sending" ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-ink-soft">Prefer email? Write to {siteConfig.contact.email}. Please don’t share sensitive personal information.</p>
    </form>
  );
}
