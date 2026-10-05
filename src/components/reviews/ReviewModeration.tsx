"use client";

import Link from "next/link";
import { Check, Star, Trash2, X } from "lucide-react";
import { StarRating } from "@/components/common/StarRating";
import { getProductById } from "@/lib/catalog";
import { cn, formatDate } from "@/lib/format";
import { reviewModeration } from "@/lib/repositories";
import { useHydrated, useLocalReviews } from "@/store/records";
import type { ReviewStatus } from "@/types";

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-grape-soft text-grape-deep",
  approved: "bg-mint-soft text-mint-deep",
  rejected: "bg-pink-soft text-pink-deep",
};

export function ReviewModeration() {
  const hydrated = useHydrated();
  const reviews = useLocalReviews();

  if (!hydrated) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;
  if (!reviews.length) {
    return <p className="rounded-3xl bg-white p-8 text-center text-ink-soft shadow-card">No reviews submitted from this browser yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        const product = getProductById(r.productId);
        return (
          <li key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("chip", STATUS_STYLE[r.status])}>{r.status}</span>
              {r.featured && <span className="chip bg-sunny-soft text-sunny-deep">featured</span>}
              <StarRating value={r.rating} />
              <span className="text-sm text-ink-soft">{formatDate(r.createdAt)}</span>
            </div>
            <p className="mt-2 font-bold">
              {r.name} on{" "}
              {product ? (
                <Link href={`/products/${product.slug}`} className="text-pink-deep hover:underline">
                  {product.name}
                </Link>
              ) : (
                r.productId
              )}
            </p>
            {r.title && <p className="mt-1 font-display font-semibold">{r.title}</p>}
            <p className="mt-1 text-ink-soft">{r.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm bg-mint-soft text-mint-deep" onClick={() => reviewModeration.setStatus(r.id, "approved")} disabled={r.status === "approved"}>
                <Check className="h-4 w-4" aria-hidden /> Approve
              </button>
              <button type="button" className="btn btn-sm bg-pink-soft text-pink-deep" onClick={() => reviewModeration.setStatus(r.id, "rejected")} disabled={r.status === "rejected"}>
                <X className="h-4 w-4" aria-hidden /> Reject
              </button>
              <button type="button" className="btn btn-sm bg-sunny-soft text-sunny-deep" onClick={() => reviewModeration.toggleFeatured(r.id)}>
                <Star className="h-4 w-4" aria-hidden /> {r.featured ? "Unfeature" : "Feature"}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => reviewModeration.remove(r.id)}>
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
