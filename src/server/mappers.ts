import "server-only";
import type { Discount, Product, Review } from "@/types";

export const PLACEHOLDER_IMAGE = { src: "/products/placeholder.svg", alt: "Photo coming soon", width: 1200, height: 1200 };

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? new Date().toISOString()));

/** Fills in safe defaults so older/partial records never break the storefront. */
export function normalizeProduct(p: Product): Product {
  return {
    ...p,
    images: p.images?.length ? p.images : [{ ...PLACEHOLDER_IMAGE, alt: `${p.name} – photo coming soon` }],
    collections: p.collections ?? [],
    audience: p.audience ?? [],
    tags: p.tags ?? [],
    stock: Number.isFinite(p.stock) ? p.stock : 0,
    gstRate: p.gstRate ?? null,
    featured: Boolean(p.featured),
    bestseller: Boolean(p.bestseller),
    newArrival: Boolean(p.newArrival),
    customisable: Boolean(p.customisable && p.customisation?.length),
  };
}

type Row = Record<string, unknown>;

export function rowToProduct(row: Row): Product {
  const data = (row.data ?? {}) as Omit<Product, "id" | "slug" | "status" | "sortOrder" | "createdAt" | "updatedAt">;
  return normalizeProduct({
    ...data,
    id: String(row.id),
    slug: String(row.slug),
    status: row.status as Product["status"],
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  } as Product);
}

export function rowToDiscount(row: Row): Discount {
  const data = (row.data ?? {}) as Omit<Discount, "id">;
  return { ...data, id: String(row.id), code: (row.code as string | null) ?? undefined, usageCount: Number(row.usage_count ?? 0) };
}

export function rowToReview(row: Row): Review {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    name: String(row.name),
    rating: Number(row.rating) as Review["rating"],
    title: (row.title as string | null) ?? undefined,
    text: String(row.text),
    status: row.status as Review["status"],
    featured: Boolean(row.featured),
    createdAt: iso(row.created_at),
  };
}
