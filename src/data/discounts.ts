import type { Discount } from "@/types";

/**
 * Discounts & coupons (Phase 1 – evaluated in the browser by `src/lib/pricing.ts`).
 *
 * Nothing about discounts is hard-coded in components: add, edit, schedule or
 * deactivate offers here. Phase 2 moves this to the `discounts` table and
 * re-validates every coupon on the server before payment.
 *
 * Only WELCOME10 is active. The others are switched off examples of every
 * supported discount type — flip `active` to use them.
 */
export const discounts: Discount[] = [
  {
    id: "d-welcome10",
    code: "WELCOME10",
    label: "Welcome 10% off",
    description: "10% off your first order of ₹300 or more.",
    kind: "standard",
    valueType: "percentage",
    value: 10,
    scope: { type: "order" },
    minimumOrder: 300,
    firstOrderOnly: true,
    active: true,
  },
  {
    id: "d-hifive20",
    code: "HIFIVE20",
    label: "₹20 off",
    description: "Flat ₹20 off orders over ₹200.",
    kind: "standard",
    valueType: "fixed",
    value: 20,
    scope: { type: "order" },
    minimumOrder: 200,
    active: false,
  },
  {
    id: "d-bracelet-week",
    label: "Bracelet Week – 15% off bracelets",
    description: "Limited-time: 15% off all bracelets.",
    kind: "standard",
    valueType: "percentage",
    value: 15,
    scope: { type: "categories", categories: ["bracelets"] },
    automatic: true,
    startsAt: "2026-11-01T00:00:00+05:30",
    endsAt: "2026-11-07T23:59:59+05:30",
    active: false,
  },
  {
    id: "d-alphabet-10",
    code: "MYNAME",
    label: "₹10 off Alphabet bracelets",
    description: "₹10 off each Alphabet Bead Bracelet.",
    kind: "standard",
    valueType: "fixed",
    value: 10,
    scope: { type: "products", productIds: ["p-alphabet-bead-bracelet"] },
    active: false,
  },
  {
    id: "d-keychain-b2g1",
    label: "Buy 2 keychains, get 1 free",
    description: "Add 3 keychains and the cheapest one is on us.",
    kind: "buy_x_get_y",
    valueType: "percentage",
    value: 0,
    scope: { type: "categories", categories: ["keychains"] },
    buyXGetY: { buyQuantity: 2, getQuantity: 1, getDiscountPercent: 100 },
    automatic: true,
    active: false,
  },
];
