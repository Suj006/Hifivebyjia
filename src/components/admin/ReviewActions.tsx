"use client";

import { Check, Star, Trash2, X } from "lucide-react";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { deleteReview, setReviewStatus, toggleReviewFeatured } from "@/server/actions/inbox";
import type { ReviewStatus } from "@/types";

export function ReviewActions({ id, status, featured }: { id: string; status: ReviewStatus; featured: boolean }) {
  const actions: RowAction[] = [];
  if (status !== "approved") actions.push({ label: <><Check className="h-4 w-4" aria-hidden /> Approve</>, tone: "primary", run: () => setReviewStatus(id, "approved") });
  if (status !== "rejected") actions.push({ label: <><X className="h-4 w-4" aria-hidden /> Reject</>, run: () => setReviewStatus(id, "rejected") });
  if (status === "approved") actions.push({ label: <><Star className="h-4 w-4" aria-hidden /> {featured ? "Unfeature" : "Feature on homepage"}</>, run: () => toggleReviewFeatured(id) });
  actions.push({ label: <><Trash2 className="h-4 w-4" aria-hidden /> Delete</>, tone: "danger", confirm: "Delete this review permanently?", run: () => deleteReview(id) });
  return <RowActions actions={actions} />;
}
