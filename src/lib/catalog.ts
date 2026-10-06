/**
 * Catalogue helpers. Pure functions over store data (`StoreData`), used both
 * on the server (pages) and in the browser (search, filters, cart).
 */
import type { Audience, Category, Collection, Product } from "@/types";

export const isPurchasable = (p: Product) => p.status === "active" && p.stock > 0;
export const isSoldOut = (p: Product) => p.status === "sold_out" || (p.status === "active" && p.stock <= 0);
export const isComingSoon = (p: Product) => p.status === "coming_soon";

export function bySortOrder(a: Product, b: Product) {
  return (a.sortOrder ?? 99) - (b.sortOrder ?? 99);
}

/** Products shown in the shop grid (active + sold out). */
export const shopProducts = (products: Product[]) => products.filter((p) => p.status === "active" || p.status === "sold_out");

export const comingSoonProducts = (products: Product[]) => products.filter(isComingSoon).sort(bySortOrder);

export const findProductBySlug = (products: Product[], slug: string) => products.find((p) => p.slug === slug);

export const toProductMap = (products: Product[]): Record<string, Product> => Object.fromEntries(products.map((p) => [p.id, p]));

export const featuredProducts = (products: Product[], limit = 8) =>
  shopProducts(products).filter((p) => p.featured).sort(bySortOrder).slice(0, limit);

export const newArrivals = (products: Product[], limit = 4) =>
  shopProducts(products)
    .filter((p) => p.newArrival)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);

export function relatedProducts(products: Product[], product: Product, limit = 4): Product[] {
  return shopProducts(products)
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        (p.category === product.category ? 3 : 0) +
        p.collections.filter((c) => product.collections.includes(c)).length +
        p.tags.filter((t) => product.tags.includes(t)).length * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

export const categoryName = (categories: Category[], slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

export function productInCollection(product: Product, collection: Collection): boolean {
  if (product.collections.includes(collection.slug)) return true;
  const rule = collection.rule;
  if (!rule) return false;
  if (rule.audience?.some((a) => product.audience.includes(a))) return true;
  if (rule.category?.includes(product.category)) return true;
  if (rule.tags?.some((t) => product.tags.includes(t))) return true;
  return false;
}

export function productsInCollection(products: Product[], collection: Collection, includeComingSoon = false): Product[] {
  const pool = includeComingSoon ? products : shopProducts(products);
  return pool.filter((p) => productInCollection(p, collection)).sort(bySortOrder);
}

export const AUDIENCE_LABELS: Record<Audience, string> = {
  kids: "Kids",
  teens: "Teens",
  adults: "Adults",
  women: "Women",
  families: "Families",
  everyone: "Everyone",
};

/* ------------------------------------------------------------------ */
/* Search, filter & sort                                               */
/* ------------------------------------------------------------------ */

export type SortOption = "featured" | "newest" | "bestselling" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export type Availability = "in-stock" | "sold-out";

export interface ProductFilters {
  q?: string;
  category?: string[];
  audience?: Audience[];
  collection?: string[];
  availability?: Availability[];
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
}

export interface CatalogContext {
  collections: Collection[];
  categories: Category[];
}

const normalise = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

function searchableText(p: Product, ctx: CatalogContext): string {
  const collectionNames = ctx.collections.filter((c) => productInCollection(p, c)).map((c) => c.name);
  return normalise(
    [p.name, p.shortDescription, p.description, categoryName(ctx.categories, p.category), p.category, ...p.tags, ...collectionNames].join(" "),
  );
}

export function searchProducts(pool: Product[], query: string, ctx: CatalogContext): Product[] {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return pool;
  return pool
    .map((p) => {
      const text = searchableText(p, ctx);
      const name = normalise(p.name);
      if (!terms.every((t) => text.includes(t) || text.includes(t.replace(/s$/, "")))) return null;
      const score = terms.reduce((s, t) => s + (name.includes(t) ? 3 : 1), 0);
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function sortProducts(list: Product[], sort: SortOption = "featured"): Product[] {
  const arr = [...list];
  // Sold-out items always sink below purchasable ones.
  const avail = (p: Product) => (isPurchasable(p) ? 0 : 1);
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => avail(a) - avail(b) || b.createdAt.localeCompare(a.createdAt));
    case "bestselling":
      return arr.sort((a, b) => avail(a) - avail(b) || Number(b.bestseller) - Number(a.bestseller) || bySortOrder(a, b));
    case "price-asc":
      return arr.sort((a, b) => avail(a) - avail(b) || a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => avail(a) - avail(b) || b.price - a.price);
    default:
      return arr.sort((a, b) => avail(a) - avail(b) || Number(b.featured) - Number(a.featured) || bySortOrder(a, b));
  }
}

export function filterProducts(pool: Product[], f: ProductFilters, ctx: CatalogContext): Product[] {
  let list = f.q ? searchProducts(pool, f.q, ctx) : pool;
  if (f.category?.length) list = list.filter((p) => f.category!.includes(p.category));
  if (f.audience?.length) list = list.filter((p) => p.audience.some((a) => f.audience!.includes(a)));
  if (f.collection?.length) {
    const cols = ctx.collections.filter((c) => f.collection!.includes(c.slug));
    list = list.filter((p) => cols.some((c) => productInCollection(p, c)));
  }
  if (f.availability?.length) {
    list = list.filter(
      (p) =>
        (f.availability!.includes("in-stock") && isPurchasable(p)) ||
        (f.availability!.includes("sold-out") && isSoldOut(p)),
    );
  }
  if (typeof f.minPrice === "number") list = list.filter((p) => p.price >= f.minPrice!);
  if (typeof f.maxPrice === "number") list = list.filter((p) => p.price <= f.maxPrice!);
  // Keep relevance order for searches unless the user picked a sort.
  if (f.q && (!f.sort || f.sort === "featured")) return list;
  return sortProducts(list, f.sort);
}

export function priceBounds(pool: Product[]) {
  if (!pool.length) return { min: 0, max: 0 };
  const prices = pool.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
