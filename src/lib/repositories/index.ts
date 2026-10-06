"use client";

/**
 * Client-side data access for submissions.
 *
 * Each submission is validated, saved on this device (so the customer can see
 * e.g. "your review is pending"), and POSTed to `/api/forms/[type]`, which
 * stores it in the database for the admin dashboard.
 */
import { siteConfig } from "@/config/site";
import { localReviewsStore, notifyStore, ordersStore } from "@/store/records";
import type { CartLine, CartTotals, CustomerDetails, NotifyRequest, OrderRequest, Review } from "@/types";
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

/**
 * Saves the order request on this device and sends it to the shop, where the
 * server re-prices it (admin → Orders). Best effort: WhatsApp is the main channel.
 */
export function recordOrderRequest(order: OrderRequest, cartLines: CartLine[], couponCode: string | null) {
  ordersStore.set((list) => [order, ...list].slice(0, 20));
  void post("order", {
    reference: order.reference,
    customer: order.customer,
    lines: cartLines.map((l) => ({ lineId: l.lineId, productId: l.productId, quantity: l.quantity, customisation: l.customisation })),
    couponCode,
    clientTotal: order.total,
  });
}
