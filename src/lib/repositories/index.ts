"use client";

/**
 * Client-side data access for submissions.
 *
 * Phase 1: each submission is validated, saved on this device, and POSTed to
 * `/api/forms/[type]`, which forwards it to FORMS_WEBHOOK_URL when configured
 * (e.g. a Google Sheet, Formspree or Make scenario) so the brand receives it.
 * Phase 2: point these functions at Supabase/real API endpoints instead.
 */
import { siteConfig } from "@/config/site";
import { localReviewsStore, notifyStore, ordersStore } from "@/store/records";
import type { CartTotals, CustomerDetails, NotifyRequest, OrderRequest, Review, ReviewStatus } from "@/types";
import type { ContactInput, ReviewInput } from "@/lib/validation";

export type FormType = "review" | "notify" | "contact" | "order";

export interface SubmitResult {
  ok: boolean;
  /** True when the submission reached the brand (webhook configured). */
  delivered: boolean;
  error?: string;
}

async function post(type: FormType, payload: unknown): Promise<SubmitResult> {
  try {
    const res = await fetch(`/api/forms/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<SubmitResult>;
    if (!res.ok) return { ok: false, delivered: false, error: data.error ?? "Something went wrong. Please try again." };
    return { ok: true, delivered: Boolean(data.delivered) };
  } catch {
    return { ok: false, delivered: false, error: "You seem to be offline. Please try again." };
  }
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------ Reviews ------------------------------ */

export async function submitReview(input: ReviewInput & { website?: string }): Promise<SubmitResult> {
  const result = await post("review", input);
  if (result.ok) {
    const review: Review = {
      id: uid("r"),
      productId: input.productId,
      name: input.name.trim(),
      rating: input.rating as Review["rating"],
      title: input.title?.trim() || undefined,
      text: input.text.trim(),
      createdAt: new Date().toISOString(),
      status: "pending", // never auto-published
    };
    localReviewsStore.set((list) => [review, ...list]);
  }
  return result;
}

/**
 * Moderation actions (used by the local moderation preview at /admin/reviews).
 * Phase 2: these become authenticated admin API calls.
 */
export const reviewModeration = {
  setStatus(id: string, status: ReviewStatus) {
    localReviewsStore.set((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  },
  toggleFeatured(id: string) {
    localReviewsStore.set((list) => list.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r)));
  },
  remove(id: string) {
    localReviewsStore.set((list) => list.filter((r) => r.id !== id));
  },
};

/* ------------------------------ Notify me ---------------------------- */

export async function submitNotify(
  email: string,
  topic: NotifyRequest["topic"],
  productId?: string,
  website?: string,
): Promise<SubmitResult> {
  const result = await post("notify", { email, topic, productId, website });
  if (result.ok) {
    notifyStore.set((list) => [
      { email: email.trim().toLowerCase(), topic, productId, createdAt: new Date().toISOString() },
      ...list.filter((n) => !(n.productId === productId && n.topic === topic)),
    ]);
  }
  return result;
}

/* ------------------------------ Contact ------------------------------ */

export async function submitContact(input: ContactInput & { website?: string }): Promise<SubmitResult> {
  return post("contact", input);
}

/* ------------------------------ Orders ------------------------------- */

export function makeOrderReference() {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${siteConfig.checkout.orderReferencePrefix}-${date}-${rand}`;
}

export function buildOrderRequest(totals: CartTotals, customer: CustomerDetails, reference: string): OrderRequest {
  const available = totals.lines.filter((l) => l.available);
  return {
    reference,
    createdAt: new Date().toISOString(),
    customer,
    lines: available.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      customisation: l.customisation,
    })),
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    discounts: totals.discounts,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    paymentMethod: "whatsapp",
    status: "requested",
  };
}

/** Saves the order request locally and notifies the brand (best effort). */
export function recordOrderRequest(order: OrderRequest) {
  ordersStore.set((list) => [order, ...list].slice(0, 20));
  void post("order", order);
}
