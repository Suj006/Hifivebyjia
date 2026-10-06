import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductCard";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { shopProducts, sortProducts } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { gridContext } from "@/lib/store-helpers";
import { getStore } from "@/server/store";

export const metadata: Metadata = pageMetadata({
  title: "Shop All Handmade Bracelets, Keychains & Gifts",
  description:
    "Shop handmade bead bracelets, personalised alphabet bracelets, keychains and gift sets from Hi Five by Jia. Search, filter and find your next favourite.",
  path: "/shop",
});

export default async function ShopPage() {
  const store = await getStore();
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ name: "Shop", path: "/shop" }]} />
      <header className="mt-4 mb-8">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Shop all <span aria-hidden>🛍️</span>
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">Handmade bracelets, keychains and gifts — for kids, teens and grown-ups.</p>
      </header>
      {/* The fallback renders the full catalogue for crawlers and no-JS visitors. */}
      <Suspense fallback={<ProductGrid products={sortProducts(shopProducts(store.products))} {...gridContext(store)} />}>
        <ShopExplorer />
      </Suspense>
    </div>
  );
}
