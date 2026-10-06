"use server";

import { getAllCategories, getAllCollections } from "@/server/admin-data";
import { requireAdmin } from "@/server/auth";
import { db, newId } from "@/server/db";
import { refreshStore } from "@/server/store";
import { sanitizeText } from "@/lib/validation";
import type { Discount, DiscountScope } from "@/types";

export type DiscountInput = Omit<Discount, "id" | "usageCount">;

export interface DiscountResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const num = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));
const isoOrUndefined = (v: unknown) => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

async function validate(input: DiscountInput, id?: string) {
  const errors: Record<string, string> = {};
  const automatic = Boolean(input.automatic);
  const code = automatic ? undefined : sanitizeText(input.code, 20).toUpperCase();
  if (!automatic && !/^[A-Z0-9-]{3,20}$/.test(code ?? "")) errors.code = "Use 3–20 letters, numbers or dashes, e.g. DIWALI15.";

  const label = sanitizeText(input.label, 60);
  if (label.length < 2) errors.label = "Give the offer a short name (shown in the cart).";

  const kind = input.kind === "buy_x_get_y" ? "buy_x_get_y" : "standard";
  const valueType = input.valueType === "fixed" ? "fixed" : "percentage";
  let value = num(input.value) ?? 0;
  let buyXGetY: Discount["buyXGetY"];
  if (kind === "buy_x_get_y") {
    const buy = Math.round(num(input.buyXGetY?.buyQuantity) ?? 0);
    const get = Math.round(num(input.buyXGetY?.getQuantity) ?? 0);
    const pct = Math.round(num(input.buyXGetY?.getDiscountPercent) ?? 100);
    if (buy < 1 || buy > 20) errors.buy = "Buy at least 1 item.";
    if (get < 1 || get > 20) errors.get = "Get at least 1 item.";
    if (pct < 1 || pct > 100) errors.getPercent = "Between 1 and 100 (100 = free).";
    buyXGetY = { buyQuantity: buy, getQuantity: get, getDiscountPercent: pct };
    value = 0;
  } else if (valueType === "percentage") {
    if (!(value >= 1 && value <= 100)) errors.value = "Enter a percentage between 1 and 100.";
  } else if (!(value >= 1 && value <= 100000)) {
    errors.value = "Enter the amount in rupees.";
  }

  const maximumDiscount = num(input.maximumDiscount);
  if (maximumDiscount !== undefined && !(maximumDiscount >= 1)) errors.maximumDiscount = "Enter a rupee amount, or leave empty for no limit.";
  const minimumOrder = num(input.minimumOrder);
  if (minimumOrder !== undefined && !(minimumOrder >= 0)) errors.minimumOrder = "Enter a rupee amount, or leave empty.";
  const usageLimit = num(input.usageLimit);
  if (usageLimit !== undefined && !(Number.isInteger(usageLimit) && usageLimit >= 1)) errors.usageLimit = "Enter a whole number, or leave empty for unlimited.";

  const startsAt = isoOrUndefined(input.startsAt);
  const endsAt = isoOrUndefined(input.endsAt);
  if (startsAt && endsAt && endsAt <= startsAt) errors.endsAt = "The end must be after the start.";

  let scope: DiscountScope = { type: "order" };
  const s = input.scope;
  if (s?.type === "categories") {
    const valid = new Set((await getAllCategories()).map((c) => c.slug));
    const list = (s.categories ?? []).filter((c) => valid.has(c));
    if (!list.length) errors.scope = "Choose at least one category.";
    scope = { type: "categories", categories: list };
  } else if (s?.type === "collections") {
    const valid = new Set((await getAllCollections()).map((c) => c.slug));
    const list = (s.collections ?? []).filter((c) => valid.has(c));
    if (!list.length) errors.scope = "Choose at least one collection.";
    scope = { type: "collections", collections: list };
  } else if (s?.type === "products") {
    const list = (s.productIds ?? []).map(String).slice(0, 200);
    if (!list.length) errors.scope = "Choose at least one product.";
    scope = { type: "products", productIds: list };
  }

  const sql = await db();
  if (code && !errors.code) {
    const [clash] = await sql`select id from discounts where code = ${code} and id <> ${id ?? ""}`;
    if (clash) errors.code = "Another coupon already uses this code.";
  }

  const data: Omit<Discount, "id" | "code" | "usageCount"> = {
    label,
    description: sanitizeText(input.description, 160),
    kind,
    valueType,
    value,
    scope,
    ...(buyXGetY ? { buyXGetY } : {}),
    ...(minimumOrder ? { minimumOrder } : {}),
    ...(maximumDiscount ? { maximumDiscount } : {}),
    ...(usageLimit ? { usageLimit } : {}),
    ...(startsAt ? { startsAt } : {}),
    ...(endsAt ? { endsAt } : {}),
    firstOrderOnly: Boolean(input.firstOrderOnly) && !automatic,
    automatic,
    promote: Boolean(input.promote) && !automatic,
    active: Boolean(input.active),
  };
  return { errors, code: code ?? null, data };
}

export async function saveDiscount(input: DiscountInput, id?: string): Promise<DiscountResult> {
  await requireAdmin();
  const { errors, code, data } = await validate(input, id);
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors };
  const sql = await db();
  const json = sql.json(JSON.parse(JSON.stringify(data)) as never);
  if (id) {
    const res = await sql`update discounts set code = ${code}, data = ${json}, updated_at = now() where id = ${id} returning id`;
    if (!res.length) return { ok: false, error: "This coupon no longer exists." };
  } else {
    id = newId("d");
    await sql`insert into discounts (id, code, data) values (${id}, ${code}, ${json})`;
  }
  refreshStore();
  return { ok: true, id };
}

export async function setDiscountActive(id: string, active: boolean): Promise<DiscountResult> {
  await requireAdmin();
  const sql = await db();
  await sql`update discounts set data = jsonb_set(data, '{active}', ${sql.json(active as never)}), updated_at = now() where id = ${id}`;
  refreshStore();
  return { ok: true };
}

export async function deleteDiscount(id: string): Promise<DiscountResult> {
  await requireAdmin();
  const sql = await db();
  await sql`delete from discounts where id = ${id}`;
  refreshStore();
  return { ok: true };
}

export async function resetDiscountUsage(id: string): Promise<DiscountResult> {
  await requireAdmin();
  const sql = await db();
  await sql`update discounts set usage_count = 0, updated_at = now() where id = ${id}`;
  refreshStore();
  return { ok: true };
}
