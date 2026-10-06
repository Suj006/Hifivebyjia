"use server";

import { redirect } from "next/navigation";
import type { TransactionSql } from "postgres";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { refreshStore } from "@/server/store";
import { categories as fileCategories } from "@/data/categories";
import { sanitizeText } from "@/lib/validation";
import type { Category, Collection, Discount } from "@/types";

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
}

export interface CategoryResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof CategoryInput, string>>;
  slug?: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CATEGORIES = 40;

type Tx = TransactionSql;

async function readSetting<T>(tx: Tx, key: string, fallback: T): Promise<T> {
  const [row] = await tx`select value from settings where key = ${key} for update`;
  return (row?.value as T) ?? fallback;
}

async function writeSetting(tx: Tx, key: string, value: unknown) {
  await tx`
    insert into settings (key, value, updated_at) values (${key}, ${tx.json(JSON.parse(JSON.stringify(value)) as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

async function moveProducts(tx: Tx, from: string, to: string) {
  await tx`
    update products set data = jsonb_set(data, '{category}', to_jsonb(${to}::text)), updated_at = now()
    where data->>'category' = ${from}`;
}

const swapIn = (list: string[], from: string, to: string | null) => [...new Set(list.flatMap((c) => (c === from ? (to ? [to] : []) : [c])))];

/**
 * Point collection rules and coupon scopes that mention category `from` at `to`
 * (a rename), or drop the mention when `to` is null (a delete).
 */
async function updateReferences(tx: Tx, from: string, to: string | null) {
  const collections = await readSetting<Collection[] | null>(tx, "collections", null);
  if (collections?.some((c) => c.rule?.category?.includes(from))) {
    await writeSetting(
      tx,
      "collections",
      collections.map((c) => {
        if (!c.rule?.category?.includes(from)) return c;
        const { category, ...rest } = c.rule;
        const next = swapIn(category ?? [], from, to);
        return { ...c, rule: next.length ? { ...rest, category: next } : rest };
      }),
    );
  }

  const discounts = await tx`select id, data from discounts where data->'scope'->>'type' = 'categories' and data->'scope'->'categories' ? ${from}`;
  for (const row of discounts) {
    const data = row.data as Discount;
    if (data.scope.type !== "categories") continue;
    const next = { ...data, scope: { type: "categories", categories: swapIn(data.scope.categories, from, to) } };
    await tx`update discounts set data = ${tx.json(JSON.parse(JSON.stringify(next)) as never)}, updated_at = now() where id = ${row.id}`;
  }
}

function validate(input: CategoryInput) {
  const name = sanitizeText(input?.name, 40);
  const slug = sanitizeText(input?.slug, 50).toLowerCase();
  const description = sanitizeText(input?.description, 200);
  const fieldErrors: CategoryResult["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Give the category a name.";
  if (!SLUG_RE.test(slug)) fieldErrors.slug = "Use lowercase letters, numbers and dashes only (e.g. hair-clips).";
  return { name, slug, description, fieldErrors };
}

/** Create a category, or update one (`originalSlug`). Renaming the web address moves its products automatically. */
export async function saveCategory(input: CategoryInput, originalSlug?: string): Promise<CategoryResult> {
  await requireAdmin();
  const { name, slug, description, fieldErrors } = validate(input);
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };

  const sql = await db();
  const result = await sql.begin(async (tx): Promise<CategoryResult> => {
    const list = await readSetting<Category[]>(tx, "categories", fileCategories);
    const index = originalSlug ? list.findIndex((c) => c.slug === originalSlug) : -1;
    if (originalSlug && index < 0) return { ok: false, error: "This category no longer exists." };
    if (list.some((c, i) => i !== index && c.slug === slug)) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another category already uses this web address." } };
    }
    if (list.some((c, i) => i !== index && c.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { name: "There is already a category with this name." } };
    }
    if (index < 0 && list.length >= MAX_CATEGORIES) return { ok: false, error: `You can have up to ${MAX_CATEGORIES} categories.` };

    const category: Category = { slug, name, description };
    const next = index < 0 ? [...list, category] : list.map((c, i) => (i === index ? category : c));
    if (originalSlug && originalSlug !== slug) {
      await moveProducts(tx, originalSlug, slug);
      await updateReferences(tx, originalSlug, slug);
    }
    await writeSetting(tx, "categories", next);
    return { ok: true, slug };
  });
  if (!result.ok) return result;
  refreshStore();
  if (originalSlug !== slug) {
    // New or renamed: go to its (new) page from the action, so the old address is never re-rendered.
    redirect(`/admin/categories/${slug}?${originalSlug ? "saved" : "created"}=1`);
  }
  return result;
}

/**
 * Delete a category. Products still in it are moved to `moveTo`; collection rules
 * and coupon scopes simply stop mentioning it.
 */
export async function deleteCategory(slug: string, moveTo?: string): Promise<CategoryResult> {
  await requireAdmin();
  const sql = await db();
  const result = await sql.begin(async (tx): Promise<CategoryResult> => {
    const list = await readSetting<Category[]>(tx, "categories", fileCategories);
    if (!list.some((c) => c.slug === slug)) return { ok: false, error: "This category no longer exists." };
    if (list.length <= 1) return { ok: false, error: "Keep at least one category." };

    const [{ count }] = await tx`select count(*)::int as count from products where data->>'category' = ${slug}`;
    const target = moveTo && moveTo !== slug && list.some((c) => c.slug === moveTo) ? moveTo : null;
    if (count > 0 && !target) return { ok: false, error: `Choose where to move the ${count} product${count === 1 ? "" : "s"} in this category.` };

    // Coupons that only apply to this category would end up applying to nothing.
    const stranded = await tx`
      select data->>'label' as label, data->>'code' as code from discounts
      where data->'scope'->>'type' = 'categories' and data->'scope'->'categories' = ${tx.json([slug])}`;
    if (stranded.length) {
      const names = stranded.map((d) => d.code || d.label).join(", ");
      return { ok: false, error: `The coupon ${names} only applies to this category. Change or delete that coupon first.` };
    }
    if (target) await moveProducts(tx, slug, target);
    await updateReferences(tx, slug, null);
    await writeSetting(tx, "categories", list.filter((c) => c.slug !== slug));
    return { ok: true };
  });
  if (!result.ok) return result;
  refreshStore();
  redirect("/admin/categories?deleted=1");
}

/** Move a category up (-1) or down (+1) in the list (order used in shop filters and admin menus). */
export async function moveCategory(slug: string, direction: -1 | 1): Promise<CategoryResult> {
  await requireAdmin();
  const sql = await db();
  await sql.begin(async (tx) => {
    const list = await readSetting<Category[]>(tx, "categories", fileCategories);
    const i = list.findIndex((c) => c.slug === slug);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    await writeSetting(tx, "categories", next);
  });
  refreshStore();
  return { ok: true };
}
