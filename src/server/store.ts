import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { siteConfig } from "@/config/site";
import { categories as fileCategories, collections as fileCollections } from "@/data/categories";
import { discounts as fileDiscounts } from "@/data/discounts";
import { products as fileProducts } from "@/data/products";
import { reviews as fileReviews } from "@/data/reviews";
import { db, isDatabaseConfigured } from "@/server/db";
import { defaultSettings } from "@/server/defaults";
import { describeDiscount } from "@/lib/pricing";
import { normalizeProduct, rowToDiscount, rowToProduct, rowToReview } from "@/server/mappers";
import type { Category, Collection, Discount, Product, StoreData, StoreSettings } from "@/types";

const PUBLIC_STATUSES = ["active", "sold_out", "coming_soon"];

const isLiveAutomatic = (d: Discount) => d.active && d.automatic && !d.code;

function finalise(
  products: Product[],
  collections: Collection[],
  categories: Category[],
  settings: StoreSettings,
  reviews: StoreData["reviews"],
  discounts: Discount[],
  source: StoreData["source"],
): StoreData {
  return {
    products: products.filter((p) => PUBLIC_STATUSES.includes(p.status)).map(normalizeProduct),
    collections: collections.filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    categories,
    // An empty WhatsApp number in settings falls back to the environment variable.
    settings: { ...settings, whatsappNumber: settings.whatsappNumber || siteConfig.contact.whatsappNumber },
    reviews: reviews.filter((r) => r.status === "approved").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    autoDiscounts: discounts.filter(isLiveAutomatic),
    promotedCoupons: discounts
      // Dates are checked in the browser at view time (this data is cached).
      .filter((d) => d.code && d.promote && d.active && !(d.usageLimit && (d.usageCount ?? 0) >= d.usageLimit))
      .map((d) => ({ code: d.code!, description: d.description || describeDiscount(d), startsAt: d.startsAt, endsAt: d.endsAt })),
    source,
  };
}

function loadFromFiles(): StoreData {
  return finalise(fileProducts, fileCollections, fileCategories, defaultSettings(), fileReviews, fileDiscounts, "files");
}

async function loadFromDatabase(): Promise<StoreData> {
  const sql = await db();
  const [productRows, discountRows, reviewRows, settingRows] = await Promise.all([
    sql`select * from products where status in ${sql(PUBLIC_STATUSES)} order by sort_order, created_at`,
    sql`select * from discounts`,
    sql`select * from reviews where status = 'approved' order by created_at desc limit 500`,
    sql`select key, value from settings where key in ('collections', 'categories', 'store')`,
  ]);
  const setting = <T,>(key: string, fallback: T): T => (settingRows.find((r) => r.key === key)?.value as T) ?? fallback;
  return finalise(
    productRows.map(rowToProduct),
    setting<Collection[]>("collections", fileCollections),
    setting<Category[]>("categories", fileCategories),
    { ...defaultSettings(), ...setting<Partial<StoreSettings>>("store", {}) },
    reviewRows.map(rowToReview),
    discountRows.map(rowToDiscount),
    "database",
  );
}

// Cached until an admin change calls refreshStore(). Pages stay fully static in between,
// and time-based offers are checked in the browser, so no timed revalidation is needed.
const cachedDatabaseStore = unstable_cache(loadFromDatabase, ["h5-store-v1"], { tags: ["store"] });

/** Everything the storefront shows. Cached; refreshed instantly by `refreshStore()`. */
export const getStore = cache(async (): Promise<StoreData> => (isDatabaseConfigured() ? cachedDatabaseStore() : loadFromFiles()));

/** Call after any admin change so the website shows it immediately. */
export function refreshStore() {
  revalidateTag("store", { expire: 0 });
  revalidatePath("/", "layout");
}
