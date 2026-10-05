import Link from "next/link";
import { StarRating } from "@/components/common/StarRating";
import { PriceTag } from "@/components/product/PriceTag";
import { ProductBadges, SampleTag } from "@/components/product/ProductBadges";
import { ProductImage } from "@/components/product/ProductImage";
import { QuickAddButton } from "@/components/product/QuickAddButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { getCategoryName, isComingSoon, isSoldOut } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { getApprovedReviews, summarizeReviews } from "@/lib/reviews";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const summary = summarizeReviews(getApprovedReviews(product.id));
  const href = `/products/${product.slug}`;
  const soldOut = isSoldOut(product);
  const hover = product.images[1];

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft", className)}>
      <div className="relative aspect-square overflow-hidden bg-pink-soft/40">
        <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          <ProductImage
            image={product.images[0]}
            alt=""
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={cn(
              "h-full w-full object-contain transition duration-500 group-hover:scale-105",
              hover && "group-hover:opacity-0",
              soldOut && "opacity-60 grayscale-[35%]",
            )}
          />
          {hover && (
            <ProductImage
              image={hover}
              alt=""
              loading="lazy"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="absolute inset-0 h-full w-full object-contain opacity-0 transition duration-500 group-hover:opacity-100"
            />
          )}
        </Link>
        <ProductBadges product={product} className="absolute top-3 left-3" />
        <WishlistButton product={product} className="absolute top-3 right-3 z-10" />
        {product.isSample && <SampleTag className="absolute bottom-3 left-3" />}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{getCategoryName(product.category)}</p>
        <h3 className="font-display text-lg leading-snug font-semibold">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {summary.count > 0 ? (
          <div className="flex items-center gap-1.5 text-sm text-ink-soft">
            <StarRating value={summary.average} />
            <span>({summary.count})</span>
          </div>
        ) : (
          <p className="line-clamp-2 text-sm text-ink-soft">{product.shortDescription}</p>
        )}
        <div className="mt-auto pt-2">
          {isComingSoon(product) ? (
            <p className="font-display text-sm font-semibold text-grape-deep">{product.launchLabel ?? "Coming soon"}</p>
          ) : (
            <PriceTag product={product} size="sm" />
          )}
        </div>
        {/* z-10 keeps the button above the card-wide link overlay */}
        <QuickAddButton product={product} className="relative z-10 mt-1" />
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" role="list">
      {products.map((p, i) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} priority={i < priorityCount} className="w-full" />
        </li>
      ))}
    </ul>
  );
}
