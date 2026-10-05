"use client";

import { useId, useState, type FormEvent } from "react";
import { Bell, Check } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/format";
import { submitNotify } from "@/lib/repositories";
import { isEmail } from "@/lib/validation";
import { useNotifyRequests } from "@/store/records";
import type { NotifyRequest } from "@/types";

interface NotifyMeFormProps {
  productId?: string;
  topic?: NotifyRequest["topic"];
  compact?: boolean;
  className?: string;
  buttonLabel?: string;
}

export function NotifyMeForm({ productId, topic = "product", compact, className, buttonLabel = "Notify me" }: NotifyMeFormProps) {
  const id = useId();
  const requests = useNotifyRequests();
  const already = requests.find((r) => r.topic === topic && r.productId === productId);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await submitNotify(email, topic, productId, honeypot);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    else track("notify_me", { product_id: productId ?? topic });
  }

  if (already) {
    return (
      <p className={cn("flex items-center gap-2 rounded-2xl bg-mint-soft px-4 py-3 text-sm font-semibold text-mint-deep", className)} role="status">
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        You’re on the list! We’ll email {already.email} when it’s ready.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("w-full", className)}>
      <label htmlFor={`${id}-email`} className={compact ? "sr-only" : "label"}>
        Email me when it’s available
      </label>
      <div className={cn("flex flex-col gap-2", !compact && "sm:flex-row")}>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn("input", compact && "py-2.5")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : `${id}-hint`}
          required
        />
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button type="submit" className={cn("btn btn-primary shrink-0", compact && "btn-sm min-h-11 w-full")} disabled={busy}>
          <Bell className="h-4 w-4" aria-hidden />
          {busy ? "Saving…" : buttonLabel}
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className={cn("mt-1.5 text-xs text-ink-soft", compact && "sr-only")}>
          No spam — just one friendly email. We never share your address.
        </p>
      )}
    </form>
  );
}
