"use client";

import Image from "next/image";
import { useId, useState, type FormEvent } from "react";
import { Clock, Star } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { StarRating } from "@/components/common/StarRating";
import { siteConfig } from "@/config/site";
import { microcopy } from "@/content/brand";
import { track } from "@/lib/analytics";
import { cn, formatDate, pluralise } from "@/lib/format";
import { submitReview } from "@/lib/repositories";
import { summarizeReviews } from "@/lib/reviews";
import { hasErrors, validateReview, type FieldErrors, type ReviewInput } from "@/lib/validation";
import { useHydrated, useLocalReviews } from "@/store/records";
import type { Review } from "@/types";

interface Props {
  productId: string;
  productName: string;
  /** Approved reviews from the server/data layer. */
  approved: Review[];
}

export function ProductReviews({ productId, productName, approved }: Props) {
  const hydrated = useHydrated();
  const local = useLocalReviews().filter((r) => r.productId === productId);
  const mine = hydrated ? local : [];
  // The customer's own submissions stay "pending" on their device until approved in admin.
  const pending = mine.filter((r) => r.status === "pending" && !approved.some((a) => a.name === r.name && a.text === r.text));
  const visible = approved;
  const summary = summarizeReviews(visible);
  const [showForm, setShowForm] = useState(false);

  return (
    <section aria-labelledby="reviews-title" className="scroll-mt-28" id="reviews">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Reviews</span>
          <h2 id="reviews-title" className="section-title mt-4">
            Customer Reviews
          </h2>
        </div>
        {!showForm && (
          <button type="button" className="btn btn-primary self-start" onClick={() => setShowForm(true)}>
            <Star className="h-5 w-5" aria-hidden /> Write a review
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <div className="card h-fit p-6">
          {summary.count > 0 ? (
            <>
              <p className="font-display text-5xl font-bold">{summary.average.toFixed(1)}</p>
              <StarRating value={summary.average} size="h-5 w-5" className="mt-2" />
              <p className="mt-1 text-sm text-ink-soft">Based on {pluralise(summary.count, "review")}</p>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-bold">No reviews yet</p>
              <p className="mt-1 text-sm text-ink-soft">{microcopy.noReviews}</p>
            </>
          )}
          <ul className="mt-5 space-y-2" aria-label="Rating distribution">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.distribution[star];
              const pct = summary.count ? (count / summary.count) * 100 : 0;
              return (
                <li key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-12 font-bold">{star} star</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                    <span className="block h-full rounded-full bg-sunny" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 text-right text-ink-soft">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-4">
          {showForm && <ReviewForm productId={productId} productName={productName} onDone={() => setShowForm(false)} />}

          {pending.map((r) => (
            <article key={r.id} className="rounded-3xl border-2 border-dashed border-grape/40 bg-grape-soft/50 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-grape-deep">
                <Clock className="h-4 w-4" aria-hidden /> Your review is pending approval
              </p>
              <StarRating value={r.rating} className="mt-2" />
              {r.title && <h3 className="mt-2 font-display text-lg font-bold">{r.title}</h3>}
              <p className="mt-1 text-ink-soft">{r.text}</p>
              <p className="mt-2 text-xs text-ink-soft">Only you can see this. It will appear publicly once approved.</p>
            </article>
          ))}

          {visible.length > 0
            ? visible.map((r) => <ReviewCard key={r.id} review={r} />)
            : !showForm &&
              pending.length === 0 && (
                <EmptyState compact mood="happy" title={microcopy.reviewPrompt} text={microcopy.noReviews} className="border border-line">
                  <button type="button" className="btn btn-primary mt-5" onClick={() => setShowForm(true)}>
                    Write the first review
                  </button>
                </EmptyState>
              )}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating} />
        <time className="text-sm text-ink-soft" dateTime={review.createdAt}>
          {formatDate(review.createdAt)}
        </time>
      </div>
      {review.title && <h3 className="mt-3 font-display text-lg font-bold">{review.title}</h3>}
      <p className="mt-2 leading-relaxed text-ink-soft">{review.text}</p>
      {review.photoUrl && (
        <Image src={review.photoUrl} alt={`Photo from ${review.name}`} width={160} height={160} className="mt-3 h-28 w-28 rounded-2xl object-cover" />
      )}
      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold">
        {review.name}
        {/* Phase 2: show "Verified Purchase" only for delivered orders. */}
        {review.verifiedPurchase && siteConfig.features.customerAccounts && <span className="chip bg-mint-soft text-mint-deep">✓ Verified Purchase</span>}
      </p>
    </article>
  );
}

function ReviewForm({ productId, productName, onDone }: { productId: string; productName: string; onDone: () => void }) {
  const id = useId();
  const [form, setForm] = useState<ReviewInput>({ productId, name: "", rating: 0, title: "", text: "" });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors<keyof ReviewInput>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [hover, setHover] = useState(0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateReview(form);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    setServerError("");
    const res = await submitReview({ ...form, website: honeypot });
    setBusy(false);
    if (!res.ok) {
      setServerError(res.error ?? "Something went wrong.");
      return;
    }
    track("submit_review", { item_id: productId, rating: form.rating });
    onDone();
  }

  const field = (k: keyof ReviewInput) => ({
    id: `${id}-${k}`,
    "aria-invalid": Boolean(errors[k]),
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-5 sm:p-6" aria-labelledby={`${id}-heading`}>
      <div>
        <h3 id={`${id}-heading`} className="font-display text-2xl font-bold">
          {microcopy.reviewPrompt}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">Reviewing: {productName}. Reviews are checked before they’re published.</p>
      </div>

      <fieldset>
        <legend className="label">Your rating *</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                className="peer sr-only"
                checked={form.rating === n}
                onChange={() => setForm((f) => ({ ...f, rating: n }))}
              />
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
              <Star
                aria-hidden
                className={cn(
                  "h-9 w-9 rounded-md transition peer-focus-visible:outline-3 peer-focus-visible:outline-grape",
                  n <= (hover || form.rating) ? "scale-110 fill-sunny text-sunny" : "fill-line text-line",
                )}
              />
            </label>
          ))}
        </div>
        {errors.rating && <p className="field-error">{errors.rating}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="label">
            Your name *
          </label>
          <input {...field("name")} className="input" autoComplete="given-name" maxLength={60} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          {errors.name && <p id={`${id}-name-err`} className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-title`} className="label">
            Title <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input {...field("title")} className="input" maxLength={100} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-text`} className="label">
          Your review *
        </label>
        <textarea {...field("text")} className="input min-h-32" maxLength={1000} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
        {errors.text && <p id={`${id}-text-err`} className="field-error">{errors.text}</p>}
        <p className="mt-1.5 text-xs text-ink-soft">
          Want to share a photo? Tag {siteConfig.social.instagram.handle} on Instagram — photo uploads are coming soon. Please don’t include phone numbers or addresses.
        </p>
      </div>

      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {serverError && (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Sending…" : "Submit review"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
