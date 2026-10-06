/**
 * Pricing & discount engine.
 *
 * Pure functions: given cart lines, products, shop settings and discount rules
 * it returns every number the cart, checkout and WhatsApp message need. The
 * same module runs on the server when an order is placed, so the admin always
 * sees totals the server calculated itself.
 */
import { siteConfig } from "@/config/site";
import type {
  AppliedCoupon,
  AppliedDiscount,
  CartLine,
  CartTotals,
  CustomisationValues,
  Discount,
  PricedLine,
  Product,
  StoreSettings,
} from "@/types";

export interface PricingContext {
  settings: Pick<StoreSettings, "shippingEnabled" | "standardShippingRate" | "freeShippingThreshold">;
  /** Automatic offers (no code needed). */
  autoDiscounts?: Discount[];
  /** The coupon the customer entered, with its rule as returned by the server. */
  coupon?: AppliedCoupon | null;
  now?: Date;
  /** True when this customer has no previous orders. */
  isFirstOrder?: boolean;
}

const RS = siteConfig.commerce.currencySymbol;

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

export function isLive(d: Discount, now = new Date()) {
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
  ctx: { now: Date; isFirstOrder: boolean },
): Evaluation {
  if (!d.active) return { ok: false, reason: "This code is not active right now." };
  if (d.usageLimit && (d.usageCount ?? 0) >= d.usageLimit) return { ok: false, reason: "Sorry, this code has reached its usage limit." };
  if (d.startsAt && ctx.now < new Date(d.startsAt)) return { ok: false, reason: "This offer hasn’t started yet." };
  if (d.endsAt && ctx.now > new Date(d.endsAt)) return { ok: false, reason: "Sorry, this offer has ended." };
  if (d.firstOrderOnly && !ctx.isFirstOrder) return { ok: false, reason: "This code is for first orders only." };
  if (d.minimumOrder && subtotal < d.minimumOrder) {
    return {
      ok: false,
      reason: `Add ${RS}${d.minimumOrder - subtotal} more to use this code (minimum order ${RS}${d.minimumOrder}).`,
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

export function calculateTotals(cartLines: CartLine[], productMap: Record<string, Product>, context: PricingContext): CartTotals {
  const now = context.now ?? new Date();
  const isFirstOrder = context.isFirstOrder ?? true;
  const ship = context.settings;
  const taxCfg = siteConfig.tax;

  const lines = priceLines(cartLines, productMap);
  const purchasable = lines.filter((l) => l.available);
  const subtotal = purchasable.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = purchasable.reduce((s, l) => s + l.quantity, 0);

  const applied: AppliedDiscount[] = [];
  let couponError: string | undefined;

  for (const d of (context.autoDiscounts ?? []).filter((r) => r.automatic && !r.code && isLive(r, now))) {
    const res = evaluateDiscount(d, purchasable, subtotal, { now, isFirstOrder });
    if (res.ok) applied.push({ discountId: d.id, label: d.label, amount: res.amount });
  }

  const coupon = context.coupon;
  if (coupon) {
    if (coupon.error || !coupon.rule) {
      couponError = coupon.error ?? "Hmm, that code doesn’t look right. Please check and try again.";
    } else {
      const res = evaluateDiscount(coupon.rule, purchasable, subtotal, { now, isFirstOrder });
      if (res.ok) applied.push({ discountId: coupon.rule.id, label: coupon.rule.label, code: coupon.code, amount: res.amount });
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
  if (ship.shippingEnabled && itemCount > 0) {
    if (ship.freeShippingThreshold && afterDiscount >= ship.freeShippingThreshold) {
      shippingLabel = "Free";
    } else {
      shipping = ship.standardShippingRate;
      shippingLabel = shipping ? `${RS}${shipping}` : "Free";
      freeShippingRemaining = ship.freeShippingThreshold ? ship.freeShippingThreshold - afterDiscount : 0;
    }
  }

  // Tax: disabled until GST classification is confirmed.
  let tax = 0;
  let taxLabel: string = taxCfg.disabledLabel;
  if (taxCfg.enabled && subtotal > 0) {
    const ratio = afterDiscount / subtotal;
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

/** Public, shareable view of a coupon rule (what the browser is allowed to see). */
export function describeDiscount(d: Discount): string {
  const RS2 = RS;
  const parts: string[] = [];
  if (d.kind === "buy_x_get_y" && d.buyXGetY) {
    parts.push(`Buy ${d.buyXGetY.buyQuantity}, get ${d.buyXGetY.getQuantity} ${d.buyXGetY.getDiscountPercent === 100 ? "free" : `${d.buyXGetY.getDiscountPercent}% off`}`);
  } else if (d.valueType === "percentage") {
    parts.push(`${d.value}% off`);
    if (d.maximumDiscount) parts.push(`up to ${RS2}${d.maximumDiscount}`);
  } else {
    parts.push(`${RS2}${d.value} off`);
  }
  if (d.minimumOrder) parts.push(`on orders of ${RS2}${d.minimumOrder}+`);
  if (d.firstOrderOnly) parts.push("first order only");
  return parts.join(" · ");
}
