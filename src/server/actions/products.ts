"use server";

import { redirect } from "next/navigation";
import { getAllCategories, getAllCollections, getProduct } from "@/server/admin-data";
import { requireAdmin } from "@/server/auth";
import { db, newId } from "@/server/db";
import { refreshStore } from "@/server/store";
import { sanitizeText } from "@/lib/validation";
import type { Audience, CustomisationField, Product, ProductImage, ProductStatus } from "@/types";

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "discountPercentage">;

export interface SaveResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const STATUSES: ProductStatus[] = ["active", "coming_soon", "sold_out", "draft", "discontinued"];
const AUDIENCES: Audience[] = ["kids", "teens", "adults", "women", "families", "everyone"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const int = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const list = (v: unknown, max = 30, len = 40) =>
  Array.isArray(v) ? [...new Set(v.map((x) => sanitizeText(x, len)).filter(Boolean))].slice(0, max) : [];

function cleanImages(raw: unknown, name: string): ProductImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 12)
    .map((img: Record<string, unknown>) => ({
      src: String(img?.src ?? ""),
      alt: sanitizeText(img?.alt, 200) || name,
      kind: img?.kind as ProductImage["kind"],
      width: int(img?.width, 1, 10000) ?? 1200,
      height: int(img?.height, 1, 10000) ?? 1200,
    }))
    .filter((img) => /^\/api\/images\/img-[a-z0-9]+$/.test(img.src) || /^\/products\/[a-z0-9/_.-]+$/i.test(img.src));
}

function cleanCustomisation(raw: unknown, errors: Record<string, string>): CustomisationField[] {
  if (!Array.isArray(raw)) return [];
  const used = new Set<string>();
  const fields: CustomisationField[] = [];
  raw.slice(0, 8).forEach((f: Record<string, unknown>, i) => {
    const label = sanitizeText(f?.label, 60);
    if (!label) {
      errors[`customisation.${i}`] = "Give this option a name.";
      return;
    }
    let id = sanitizeText(f?.id, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `option-${i + 1}`;
    while (used.has(id)) id = `${id}-${i + 1}`;
    used.add(id);
    const type = (["select", "text", "textarea"] as const).includes(f?.type as never) ? (f.type as CustomisationField["type"]) : "select";
    const field: CustomisationField = { id, label, type, required: Boolean(f?.required) };
    if (type === "select") {
      const options = list(f?.options, 20, 60);
      if (!options.length) errors[`customisation.${i}`] = `Add at least one choice for “${label}”.`;
      field.options = options;
    } else {
      field.maxLength = int(f?.maxLength, 1, 500) ?? (type === "text" ? 20 : 200);
      const placeholder = sanitizeText(f?.placeholder, 60);
      if (placeholder) field.placeholder = placeholder;
    }
    const help = sanitizeText(f?.helpText, 120);
    if (help) field.helpText = help;
    if (f?.pattern === "^[A-Za-z0-9 ♥]+$") {
      field.pattern = "^[A-Za-z0-9 ♥]+$";
      field.patternMessage = "Please use letters, numbers, spaces or ♥ only.";
    }
    const extra = int(f?.priceAdjustment, 0, 100000);
    if (extra) field.priceAdjustment = extra;
    fields.push(field);
  });
  return fields;
}

async function validate(input: ProductInput, id?: string) {
  const errors: Record<string, string> = {};
  const name = sanitizeText(input.name, 100);
  if (name.length < 2) errors.name = "Please enter the product name.";
  const slug = sanitizeText(input.slug, 80).toLowerCase();
  if (!SLUG_RE.test(slug)) errors.slug = "Use lowercase letters, numbers and dashes only, e.g. heart-charm-bracelet.";
  const price = int(input.price, 0, 1000000);
  if (price === null) errors.price = "Enter the price in rupees (whole number).";
  const compareAt = input.compareAtPrice ? int(input.compareAtPrice, 0, 1000000) : null;
  if (input.compareAtPrice && (compareAt === null || (price !== null && compareAt <= price))) {
    errors.compareAtPrice = "The original price must be higher than the selling price (or leave it empty).";
  }
  const stock = int(input.stock, 0, 1000000);
  if (stock === null) errors.stock = "Enter how many you have (0 or more).";
  const status = STATUSES.includes(input.status) ? input.status : null;
  if (!status) errors.status = "Choose a status.";

  const [categories, collections] = await Promise.all([getAllCategories(), getAllCollections()]);
  const category = categories.some((c) => c.slug === input.category) ? input.category : "";
  if (!category) errors.category = "Choose a category.";
  const collectionSlugs = new Set(collections.map((c) => c.slug));

  const sql = await db();
  if (!errors.slug) {
    const [clash] = await sql`select id from products where slug = ${slug} and id <> ${id ?? ""}`;
    if (clash) errors.slug = "Another product already uses this web address. Try adding a word.";
  }

  const customisation = cleanCustomisation(input.customisation, errors);
  const images = cleanImages(input.images, name);

  const data: Omit<Product, "id" | "slug" | "status" | "sortOrder" | "createdAt" | "updatedAt"> = {
    name,
    shortDescription: sanitizeText(input.shortDescription, 200),
    description: sanitizeText(input.description, 3000),
    price: price ?? 0,
    ...(compareAt ? { compareAtPrice: compareAt } : {}),
    images,
    category,
    collections: list(input.collections).filter((c) => collectionSlugs.has(c)),
    audience: list(input.audience).filter((a): a is Audience => AUDIENCES.includes(a as Audience)),
    tags: list(input.tags, 30, 30).map((t) => t.toLowerCase()),
    stock: stock ?? 0,
    sku: sanitizeText(input.sku, 40) || `H5-${slug.toUpperCase().slice(0, 20)}`,
    featured: Boolean(input.featured),
    bestseller: Boolean(input.bestseller),
    newArrival: Boolean(input.newArrival),
    customisable: customisation.length > 0,
    customisation,
    weight: int(input.weight, 0, 100000) ?? undefined,
    dimensions: {
      circumferenceCm: Number(input.dimensions?.circumferenceCm) > 0 ? Number(input.dimensions?.circumferenceCm) : undefined,
      lengthCm: Number(input.dimensions?.lengthCm) > 0 ? Number(input.dimensions?.lengthCm) : undefined,
    },
    hsn: sanitizeText(input.hsn, 20) || undefined,
    gstRate: input.gstRate === null || input.gstRate === undefined || String(input.gstRate) === "" ? null : int(input.gstRate, 0, 28),
    launchLabel: sanitizeText(input.launchLabel, 60) || undefined,
    launchDate: /^\d{4}-\d{2}-\d{2}/.test(String(input.launchDate ?? "")) ? String(input.launchDate).slice(0, 10) : undefined,
    isSample: Boolean(input.isSample),
    materials: list(input.materials, 10, 60),
    care: sanitizeText(input.care, 500) || undefined,
  };
  return { errors, slug, status: status ?? "draft", sortOrder: int(input.sortOrder, -1000, 100000) ?? 0, data };
}

async function deleteImages(srcs: string[]) {
  const ids = srcs.map((s) => s.match(/^\/api\/images\/(img-[a-z0-9]+)$/)?.[1]).filter((x): x is string => Boolean(x));
  if (!ids.length) return;
  const sql = await db();
  await sql`delete from images where id in ${sql(ids)}`;
}

/** Photos uploaded for a product that was never saved: remove once they are a day old. */
async function deleteAbandonedUploads() {
  const sql = await db();
  await sql`
    delete from images
    where created_at < now() - interval '1 day'
      and not exists (
        select 1 from products
        where products.data->'images' @> jsonb_build_array(jsonb_build_object('src', '/api/images/' || images.id))
      )`;
}

export async function saveProduct(input: ProductInput, id?: string): Promise<SaveResult> {
  await requireAdmin();
  const { errors, slug, status, sortOrder, data } = await validate(input, id);
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors };

  const sql = await db();
  const json = sql.json(JSON.parse(JSON.stringify(data)) as never);
  if (id) {
    const previous = await getProduct(id);
    if (!previous) return { ok: false, error: "This product no longer exists." };
    await sql`
      update products set slug = ${slug}, status = ${status}, sort_order = ${sortOrder}, data = ${json}, updated_at = now()
      where id = ${id}`;
    const kept = new Set(data.images.map((i) => i.src));
    await deleteImages(previous.images.map((i) => i.src).filter((s) => !kept.has(s)));
  } else {
    const [taken] = await sql`select 1 from products where id = ${`p-${slug}`}`;
    id = taken ? newId("p") : `p-${slug}`;
    await sql`
      insert into products (id, slug, status, sort_order, data)
      values (${id}, ${slug}, ${status}, ${sortOrder}, ${json})`;
  }
  await deleteAbandonedUploads().catch((e) => console.error("Image cleanup failed", e));
  refreshStore();
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<SaveResult> {
  await requireAdmin();
  const product = await getProduct(id);
  if (!product) return { ok: false, error: "Product not found." };
  const sql = await db();
  await sql`delete from products where id = ${id}`;
  await deleteImages(product.images.map((i) => i.src));
  refreshStore();
  // Redirect from the action: the page we were on no longer exists, so it must not be re-rendered.
  redirect("/admin/products");
}

export async function duplicateProduct(id: string): Promise<SaveResult> {
  await requireAdmin();
  const product = await getProduct(id);
  if (!product) return { ok: false, error: "Product not found." };
  const sql = await db();
  let slug = `${product.slug}-copy`;
  for (let n = 2; (await sql`select 1 from products where slug = ${slug}`).length; n++) slug = `${product.slug}-copy-${n}`;
  const newProductId = newId("p");
  const data: Record<string, unknown> = { ...product, name: `${product.name} (copy)` };
  for (const key of ["id", "slug", "status", "sortOrder", "createdAt", "updatedAt"]) delete data[key];
  // Uploaded photos belong to one product (they're deleted with it), so the copy starts without them.
  data.images = product.images.filter((i) => !i.src.startsWith("/api/images/"));
  await sql`
    insert into products (id, slug, status, sort_order, data)
    values (${newProductId}, ${slug}, 'draft', ${product.sortOrder ?? 0}, ${sql.json(JSON.parse(JSON.stringify(data)) as never)})`;
  refreshStore();
  return { ok: true, id: newProductId };
}

/** Quick stock update from the product list. */
export async function updateStock(id: string, stock: number): Promise<SaveResult> {
  await requireAdmin();
  const value = int(stock, 0, 1000000);
  if (value === null) return { ok: false, error: "Stock must be 0 or more." };
  const sql = await db();
  await sql`update products set data = jsonb_set(data, '{stock}', ${sql.json(value as never)}), updated_at = now() where id = ${id}`;
  refreshStore();
  return { ok: true };
}
