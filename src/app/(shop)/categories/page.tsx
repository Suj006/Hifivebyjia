import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Reveal } from "@/components/common/Reveal";
import { CollectionCard } from "@/components/product/CollectionCard";
import { getStore } from "@/server/store";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Collections",
  description: "Browse Hi Five by Jia collections: bracelets, alphabet beads, keychains, gifts and picks for kids, teens and adults.",
  path: "/categories",
});

export default async function CollectionsPage() {
  const store = await getStore();
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ name: "Collections", path: "/categories" }]} />
      <header className="mt-4 mb-10">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Collections <span aria-hidden>🌈</span>
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">Find your vibe — for kids, teens, grown-ups and gifting.</p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {store.collections.map((c) => (
          <Reveal as="li" key={c.slug}>
            <CollectionCard collection={c} products={store.products} className="sm:min-h-64" />
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
