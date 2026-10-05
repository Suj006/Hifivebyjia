import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { JsonLd } from "@/components/common/JsonLd";
import { StarRating } from "@/components/common/StarRating";
import { ProductBadges, SampleTag } from "@/components/product/ProductBadges";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import {
  AUDIENCE_LABELS,
  getCategoryName,
  getCollections,
  getPublicProducts,
  getProductBySlug,
  getRelatedProducts,
  productInCollection,
} from "@/lib/catalog";
import { pluralise } from "@/lib/format";
import { getApprovedReviews, summarizeReviews } from "@/lib/reviews";
import { pageMetadata, productJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getPublicProducts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return pageMetadata({
    title: product.name,
    description: `${product.shortDescription} ${product.description}`.slice(0, 158),
    path: `/products/${product.slug}`,
    image: product.images[0]?.src,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const reviews = getApprovedReviews(product.id);
  const summary = summarizeReviews(reviews);
  const related = getRelatedProducts(product, 4);
  const collections = getCollections().filter((c) => productInCollection(product, c));

  const details: { label: string; value: string }[] = [
    { label: "Category", value: getCategoryName(product.category) },
    { label: "Perfect for", value: product.audience.map((a) => AUDIENCE_LABELS[a]).join(", ") },
    ...(product.materials?.length ? [{ label: "Materials", value: product.materials.join(", ") }] : []),
    ...(product.dimensions?.circumferenceCm ? [{ label: "Size", value: `Approx. ${product.dimensions.circumferenceCm} cm around (stretchy)` }] : []),
    ...(product.dimensions?.lengthCm ? [{ label: "Length", value: `Approx. ${product.dimensions.lengthCm} cm` }] : []),
    { label: "SKU", value: product.sku },
  ];

  return (
    <div className="container-page py-6 sm:py-10">
      <JsonLd data={productJsonLd(product, reviews)} />
      <Breadcrumbs
        items={[
          { name: "Shop", path: "/shop" },
          ...(collections[0] ? [{ name: collections[0].name, path: `/categories/${collections[0].slug}` }] : []),
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} badge={<ProductBadges product={product} />} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/categories/${collections[0]?.slug ?? "bracelets"}`} className="text-sm font-bold tracking-wider text-pink-deep uppercase hover:underline">
              {getCategoryName(product.category)}
            </Link>
            {product.isSample && <SampleTag />}
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{product.name}</h1>
          <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-pink-deep">
            {summary.count > 0 ? (
              <>
                <StarRating value={summary.average} /> {summary.average.toFixed(1)} · {pluralise(summary.count, "review")}
              </>
            ) : (
              <>No reviews yet · Be the first!</>
            )}
          </a>

          <div className="mt-6">
            <PurchasePanel product={product} />
          </div>

          <div className="mt-10 space-y-3">
            <details className="group card p-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
                Description <span className="transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{product.description}</p>
            </details>
            <details className="group card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
                Details <span className="transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                {details.map((d) => (
                  <div key={d.label} className="contents">
                    <dt className="font-bold">{d.label}</dt>
                    <dd className="text-ink-soft">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
            {product.care && (
              <details className="group card p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
                  Care &amp; safety <span className="transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{product.care}</p>
                <p className="mt-2 text-sm font-semibold text-ink-soft">Contains small parts — not suitable for children under 3.</p>
              </details>
            )}
            <details className="group card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
                Shipping &amp; returns <span className="transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Ships across India. See our <Link href="/shipping" className="font-bold text-pink-deep hover:underline">shipping</Link> and{" "}
                <Link href="/returns" className="font-bold text-pink-deep hover:underline">returns</Link> policies for details.
              </p>
            </details>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <ProductReviews productId={product.id} productName={product.name} approved={reviews} />
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="section-title">
            You might also love
          </h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
