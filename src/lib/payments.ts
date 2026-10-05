/**
 * Payment provider interface — PHASE 2 (not active).
 *
 * Phase 1 orders are confirmed over WhatsApp; no card/UPI data is ever
 * collected. In Phase 2 the checkout calls `startOnlinePayment()`:
 *
 *   1. POST /api/orders           → server re-prices the cart with `calculateTotals`
 *                                   (never trusting client totals), applies coupons,
 *                                   shipping and GST, creates a pending order and a
 *                                   Razorpay order; returns { orderId, razorpayOrderId, amount }.
 *   2. Razorpay Checkout opens    → customer pays by UPI / card / netbanking.
 *   3. POST /api/payments/verify  → server verifies the HMAC signature with
 *                                   RAZORPAY_KEY_SECRET, marks the order paid,
 *                                   reduces inventory, sends email/WhatsApp confirmation.
 *   4. Redirect to /order-confirmation?ref=…
 *
 * A Razorpay webhook (`payment.captured`) acts as the source of truth if the
 * browser closes mid-payment.
 */
import { siteConfig } from "@/config/site";
import type { CustomerDetails, CartLine } from "@/types";

export interface StartPaymentInput {
  lines: CartLine[];
  couponCode: string | null;
  customer: CustomerDetails;
}

export interface StartPaymentResult {
  orderReference: string;
  providerOrderId: string;
  amount: number;
  currency: string;
}

export const isOnlinePaymentEnabled = () => siteConfig.checkout.onlinePaymentEnabled;

export async function startOnlinePayment(input: StartPaymentInput): Promise<StartPaymentResult> {
  void input;
  throw new Error("Online payment is coming soon. Please order via WhatsApp for now.");
}
