import "server-only";
import { discounts as fileDiscounts } from "@/data/discounts";
import { toProductMap } from "@/lib/catalog";
import { calculateTotals } from "@/lib/pricing";
import { hasErrors, sanitizeText, validateCustomer, validateCustomisation } from "@/lib/validation";
import { db, isDatabaseConfigured, newId } from "@/server/db";
import { rowToDiscount, rowToProduct } from "@/server/mappers";
import { getStore } from "@/server/store";
import type { AppliedCoupon, CartLine, CustomerDetails, Discount, Product } from "@/types";

/* ------------------------------ Coupons ------------------------------ */

async function findCouponRule(code: string): Promise<Discount | null> {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return null;
  if (!isDatabaseConfigured()) return fileDiscounts.find((d) => d.code?.toUpperCase() === normalised) ?? null;
  const sql = await db();
  const [row] = await sql`select * from discounts where code = ${normalised}`;
  return row ? rowToDiscount(row) : null;
}

/** Looks up a coupon for the cart. Only the requested code is ever revealed. */
export async function lookupCoupon(code: string): Promise<AppliedCoupon> {
  const normalised = sanitizeText(code, 40).toUpperCase();
  const rule = await findCouponRule(normalised);
  if (!rule) return { code: normalised, rule: null, error: "Hmm, that code doesn’t look right. Please check and try again." };
  return { code: normalised, rule };
}

/* ------------------------------ Orders ------------------------------- */

export interface OrderSubmission {
  reference: string;
  customer: CustomerDetails;
  lines: CartLine[];
  couponCode: string | null;
  clientTotal: number;
}

async function isFirstOrder(customer: CustomerDetails): Promise<boolean> {
  const sql = await db();
  const mobile = customer.mobile.replace(/\D/g, "").slice(-10);
  const [row] = await sql`
    select 1 from orders
    where status <> 'cancelled'
      and (lower(customer->>'email') = ${customer.email.toLowerCase()} or right(regexp_replace(customer->>'mobile', '[^0-9]', '', 'g'), 10) = ${mobile})
    limit 1`;
  return !row;
}

/**
 * Stores an order request with totals calculated on the server (prices,
 * coupons and shipping from the database — never trusted from the browser).
 */
export async function createOrder(input: OrderSubmission): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  const customer: CustomerDetails = {
    name: sanitizeText(input.customer?.name, 80),
    mobile: sanitizeText(input.customer?.mobile, 20),
    email: sanitizeText(input.customer?.email, 120),
    address: sanitizeText(input.customer?.address, 300),
    city: sanitizeText(input.customer?.city, 80),
    state: sanitizeText(input.customer?.state, 80),
    pincode: sanitizeText(input.customer?.pincode, 10),
    notes: sanitizeText(input.customer?.notes, 500),
  };
  if (hasErrors(validateCustomer(customer))) return { ok: false, error: "Please check your details." };

  const sql = await db();
  const ids = [...new Set((input.lines ?? []).map((l) => String(l.productId)))].slice(0, 50);
  if (!ids.length) return { ok: false, error: "Your order is empty." };
  const productRows = await sql`select * from products where id in ${sql(ids)}`;
  const products: Product[] = productRows.map(rowToProduct);
  const map = toProductMap(products);

  const lines: CartLine[] = [];
  for (const l of input.lines.slice(0, 50)) {
    const product = map[l.productId];
    if (!product) continue;
    const customisation: Record<string, string> = {};
    for (const f of product.customisation ?? []) {
      const v = sanitizeText(l.customisation?.[f.id], f.maxLength ?? 200);
      if (v) customisation[f.id] = v;
    }
    if (hasErrors(validateCustomisation(product.customisation, customisation))) {
      return { ok: false, error: `Please check the options for ${product.name}.` };
    }
    lines.push({
      lineId: String(l.lineId ?? product.id),
      productId: product.id,
      quantity: Math.min(20, Math.max(1, Math.floor(Number(l.quantity) || 1))),
      customisation: Object.keys(customisation).length ? customisation : undefined,
      addedAt: new Date().toISOString(),
    });
  }
  if (!lines.length) return { ok: false, error: "Your order is empty." };

  const store = await getStore();
  const coupon = input.couponCode ? await lookupCoupon(input.couponCode) : null;
  const totals = calculateTotals(lines, map, {
    settings: store.settings,
    autoDiscounts: store.autoDiscounts,
    coupon,
    isFirstOrder: await isFirstOrder(customer),
  });
  if (totals.itemCount === 0) return { ok: false, error: "These items are no longer available." };

  const orderLines = totals.lines
    .filter((l) => l.available)
    .map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      sku: l.product.sku,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      customisation: l.customisation ?? null,
    }));
  const storedTotals = {
    subtotal: totals.subtotal,
    discounts: totals.discounts,
    discountTotal: totals.discountTotal,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    couponError: totals.couponError ?? null,
  };
  const usedCode = totals.discounts.find((d) => d.code)?.code ?? null;
  const reference = sanitizeText(input.reference, 40) || newId("H5");

  const inserted = await sql`
    insert into orders (id, reference, status, customer, lines, totals, coupon_code, client_total)
    values (${newId("o")}, ${reference}, 'requested', ${sql.json(customer as never)}, ${sql.json(orderLines as never)},
            ${sql.json(storedTotals as never)}, ${usedCode}, ${Math.round(Number(input.clientTotal) || 0)})
    on conflict (reference) do nothing
    returning id`;
  if (inserted.length && usedCode) {
    await sql`update discounts set usage_count = usage_count + 1 where code = ${usedCode}`;
  }
  return { ok: true, total: totals.total };
}

/* ------------------------- Reviews, notify, contact ------------------------- */

export async function createReview(input: { productId: string; name: string; rating: number; title?: string; text: string }) {
  const sql = await db();
  await sql`
    insert into reviews (id, product_id, name, rating, title, text, status)
    values (${newId("r")}, ${input.productId}, ${input.name}, ${input.rating}, ${input.title || null}, ${input.text}, 'pending')`;
}

export async function createNotify(input: { email: string; topic: string; productId?: string }) {
  const sql = await db();
  await sql`
    insert into notify_requests (email, topic, product_id)
    values (${input.email}, ${input.topic}, ${input.productId ?? null})
    on conflict do nothing`;
}

export async function createMessage(input: { name: string; email: string; message: string }) {
  const sql = await db();
  await sql`insert into messages (name, email, message) values (${input.name}, ${input.email}, ${input.message})`;
}
