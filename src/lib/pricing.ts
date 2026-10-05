/**
 * Pricing & discount engine.
 *
 * Pure functions: given cart lines, the catalogue and the discount rules, it
 * returns every number the cart, checkout and WhatsApp message need. Phase 2
 * runs this same module on the server to re-verify totals before creating a
 * Razorpay order, so the frontend never has to change.
 */
import { siteConfig } from "@/config/site";
import { discounts as discountRules } from "@/data/discounts";
import type {
  AppliedDiscount,
  CartLine,
  CartTotals,
  CustomisationValues,
  Discount,
  PricedLine,
  Product,
} from "@/types";

export interface PricingContext {
  now?: Date;
  /** Phase 1: true when no previous order request exists on this device. */
  isFirstOrder?: boolean;
  discounts?: Discount[];
}

export function unitPriceFor(product: Product, customisation?: CustomisationValues): number {
  let price = product.price;
  for (const field of product.customisation ?? []) {
    if (field.priceAdjustment && customisation?.[field.id]?.trim()) price += field.priceAdjustment;
  }
  return price;
}

export function priceLines(lines: CartLine[], productMap: Record<string, Product>): PricedLine[] {
  return lines.flatMap((line): PricedLine[] => {
      const product = productMap[line.productId];
      if (!product) return [];
      const unitPrice = unitPriceFor(product, line.customisation);
      return [{
        lineId: line.lineId,
        product,
        quantity: line.quantity,
        customisation: line.customisation,
        unitPrice,
        lineTotal: unitPrice * line.quantity,
        available: product.status === "active" && product.stock > 0,
      }];
    });
}

function inScope(discount: Discount, line: PricedLine): boolean {
  const scope = discount.scope;
  switch (scope.type) {
    case "order":
      return true;
    case "products":
      return scope.productIds.includes(line.product.id);
    case "categories":
      return scope.categories.includes(line.product.category);
    case "collections":
      return line.product.collections.some((c) => scope.collections.includes(c));
  }
}

function isLive(d: Discount, now: Date) {
  if (!d.active) return false;
  if (d.startsAt && now < new Date(d.startsAt)) return false;
  if (d.endsAt && now > new Date(d.endsAt)) return false;
  return true;
}

type Evaluation = { ok: true; amount: number } | { ok: false; reason: string };

export function evaluateDiscount(
  d: Discount,
  lines: PricedLine[],
  subtotal: number,
  ctx: Required<Pick<PricingContext, "now" | "isFirstOrder">>,
): Evaluation {
  if (!d.active) return { ok: false, reason: "This code is not active right now." };
  if (d.startsAt && ctx.now < new Date(d.startsAt)) return { ok: false, reason: "This offer hasn’t started yet." };
  if (d.endsAt && ctx.now > new Date(d.endsAt)) return { ok: false, reason: "Sorry, this offer has ended." };
  if (d.firstOrderOnly && !ctx.isFirstOrder) return { ok: false, reason: "This code is for first orders only." };
  if (d.minimumOrder && subtotal < d.minimumOrder) {
    return {
      ok: false,
      reason: `Add ${siteConfig.commerce.currencySymbol}${d.minimumOrder - subtotal} more to use this code (minimum order ${siteConfig.commerce.currencySymbol}${d.minimumOrder}).`,
    };
  }

  const eligible = lines.filter((l) => l.available && inScope(d, l));
  if (!eligible.length) return { ok: false, reason: "This code doesn’t apply to the items in your cart." };
  const eligibleSubtotal = eligible.reduce((s, l) => s + l.lineTotal, 0);

  let amount = 0;
  if (d.kind === "buy_x_get_y" && d.buyXGetY) {
    const { buyQuantity, getQuantity, getDiscountPercent } = d.buyXGetY;
    const units = eligible.flatMap((l) => Array.from({ length: l.quantity }, () => l.unitPrice)).sort((a, b) => b - a);
    const group = buyQuantity + getQuantity;
    for (let i = 0; i + group <= units.length; i += group) {
      // The cheapest `getQuantity` units in each group are discounted.
      for (let k = i + buyQuantity; k < i + group; k++) amount += (units[k] * getDiscountPercent) / 100;
    }
    if (amount <= 0) {
      return { ok: false, reason: `Add ${group} eligible items to unlock this offer.` };
    }
  } else if (d.valueType === "percentage") {
    amount = (eligibleSubtotal * d.value) / 100;
  } else {
    // Fixed: once per order for order-wide offers, per unit for scoped offers.
    const units = d.scope.type === "order" ? 1 : eligible.reduce((s, l) => s + l.quantity, 0);
    amount = d.value * units;
  }

  if (d.maximumDiscount) amount = Math.min(amount, d.maximumDiscount);
  amount = Math.min(Math.round(amount), eligibleSubtotal);
  return amount > 0 ? { ok: true, amount } : { ok: false, reason: "This code doesn’t apply to your cart." };
}

export function findCoupon(code: string, rules: Discount[] = discountRules): Discount | undefined {
  const normalised = code.trim().toUpperCase();
  return rules.find((d) => d.code?.toUpperCase() === normalised);
}

export function calculateTotals(
  cartLines: CartLine[],
  productMap: Record<string, Product>,
  couponCode: string | null,
  context: PricingContext = {},
): CartTotals {
  const now = context.now ?? new Date();
  const isFirstOrder = context.isFirstOrder ?? true;
  const rules = context.discounts ?? discountRules;
  const { shipping: ship, tax: taxCfg } = siteConfig;

  const lines = priceLines(cartLines, productMap);
  const purchasable = lines.filter((l) => l.available);
  const subtotal = purchasable.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = purchasable.reduce((s, l) => s + l.quantity, 0);

  const applied: AppliedDiscount[] = [];
  let couponError: string | undefined;

  for (const d of rules.filter((r) => r.automatic && !r.code && isLive(r, now))) {
    const res = evaluateDiscount(d, purchasable, subtotal, { now, isFirstOrder });
    if (res.ok) applied.push({ discountId: d.id, label: d.label, amount: res.amount });
  }

  if (couponCode) {
    const coupon = findCoupon(couponCode, rules);
    if (!coupon) {
      couponError = "Hmm, that code doesn’t look right. Please check and try again.";
    } else {
      const res = evaluateDiscount(coupon, purchasable, subtotal, { now, isFirstOrder });
      if (res.ok) applied.push({ discountId: coupon.id, label: coupon.label, code: coupon.code, amount: res.amount });
      else couponError = res.reason;
    }
  }

  const discountTotal = Math.min(
    applied.reduce((s, d) => s + d.amount, 0),
    subtotal,
  );
  const afterDiscount = subtotal - discountTotal;

  let shipping = 0;
  let shippingLabel = "—";
  let freeShippingRemaining = 0;
  if (ship.enabled && itemCount > 0) {
    if (ship.freeShippingThreshold && afterDiscount >= ship.freeShippingThreshold) {
      shippingLabel = "Free";
    } else {
      shipping = ship.standardRate;
      shippingLabel = `${siteConfig.commerce.currencySymbol}${ship.standardRate}`;
      freeShippingRemaining = ship.freeShippingThreshold ? ship.freeShippingThreshold - afterDiscount : 0;
    }
  }

  // Tax: disabled until GST classification is confirmed.
  let tax = 0;
  let taxLabel: string = taxCfg.disabledLabel;
  if (taxCfg.enabled && subtotal > 0) {
    const ratio = subtotal > 0 ? afterDiscount / subtotal : 0;
    for (const l of purchasable) {
      const rate = l.product.gstRate ?? taxCfg.defaultRate;
      if (rate == null) continue;
      const base = l.lineTotal * ratio;
      tax += taxCfg.pricesIncludeTax ? (base * rate) / (100 + rate) : (base * rate) / 100;
    }
    tax = Math.round(tax);
    taxLabel = taxCfg.pricesIncludeTax ? "Included in prices" : "Estimated GST";
  }

  const total = afterDiscount + shipping + (taxCfg.enabled && !taxCfg.pricesIncludeTax ? tax : 0);

  return {
    lines,
    itemCount,
    subtotal,
    discounts: applied,
    discountTotal,
    shipping,
    shippingLabel,
    freeShippingRemaining: Math.max(0, freeShippingRemaining),
    tax,
    taxLabel,
    total,
    couponError,
  };
}

/** Active coupon codes that can be advertised (e.g. in the cart). */
export function getPromotedCoupons(now = new Date()): Discount[] {
  return discountRules.filter((d) => d.code && isLive(d, now));
}
