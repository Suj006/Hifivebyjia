import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { THEME_CLASSES } from "@/components/product/CollectionCard";
import { ProductGrid } from "@/components/product/ProductCard";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { getCollection, getCollections, getProductsInCollection } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getCollections().map((c) => ({ category: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const collection = getCollection(category);
  if (!collection) return {};
  return pageMetadata({
    title: `${collection.name} Collection`,
    description: `${collection.tagline} ${collection.description} Shop the ${collection.name} collection from Hi 5 by Jia.`,
    path: `/categories/${collection.slug}`,
  });
}

export default async function CollectionPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const collection = getCollection(category);
  if (!collection) notFound();
  const products = getProductsInCollection(collection.slug);
  const theme = THEME_CLASSES[collection.theme];
  const others = getCollections().filter((c) => c.slug !== collection.slug);

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { name: "Collections", path: "/categories" },
          { name: collection.name, path: `/categories/${collection.slug}` },
        ]}
      />
      <header className={cn("relative mt-4 mb-10 overflow-hidden rounded-[2rem] bg-linear-to-br p-8 sm:p-12", theme.bg)}>
        <span className="text-5xl" aria-hidden>
          {collection.emoji}
        </span>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{collection.name}</h1>
        <p className={cn("mt-2 font-display text-xl font-semibold", theme.accent)}>{collection.tagline}</p>
        <p className="mt-2 max-w-2xl text-ink-soft">{collection.description}</p>
      </header>

      {products.length ? (
        <Suspense fallback={<ProductGrid products={products} />}>
          <ShopExplorer fixedCollection={collection.slug} />
        </Suspense>
      ) : (
        <EmptyState
          mood="thinking"
          title="Something fun is on the way!"
          text="Nainu is still working on pieces for this collection. Peek at what’s coming soon."
          action={{ label: "See Coming Soon", href: "/coming-soon" }}
        />
      )}

      <nav className="mt-16" aria-label="Other collections">
        <h2 className="font-display text-2xl font-bold">More collections</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((c) => (
            <li key={c.slug}>
              <Link href={`/categories/${c.slug}`} className="chip bg-white px-4 py-2 text-sm text-ink shadow-sm hover:bg-pink-soft">
                <span aria-hidden>{c.emoji}</span> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
