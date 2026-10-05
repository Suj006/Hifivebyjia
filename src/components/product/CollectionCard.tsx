import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { getProductsInCollection } from "@/lib/catalog";
import { cn, pluralise } from "@/lib/format";
import type { Collection, CollectionTheme } from "@/types";

export const THEME_CLASSES: Record<CollectionTheme, { bg: string; accent: string }> = {
  pink: { bg: "from-pink-soft to-[#FFD0E6]", accent: "text-pink-deep" },
  sunny: { bg: "from-sunny-soft to-[#FFE6A3]", accent: "text-sunny-deep" },
  sky: { bg: "from-sky-soft to-[#C2EBFF]", accent: "text-sky-deep" },
  grape: { bg: "from-grape-soft to-[#DCD3FF]", accent: "text-grape-deep" },
  mint: { bg: "from-mint-soft to-[#C3F0E1]", accent: "text-mint-deep" },
  tangerine: { bg: "from-tangerine-soft to-[#FFD6BF]", accent: "text-tangerine-deep" },
};

export function CollectionCard({ collection, className }: { collection: Collection; className?: string }) {
  const items = getProductsInCollection(collection.slug);
  const cover = items[0]?.images[0];
  const theme = THEME_CLASSES[collection.theme];

  return (
    <Link
      href={`/categories/${collection.slug}`}
      className={cn(
        "group relative flex h-full min-h-44 flex-col overflow-hidden rounded-[1.75rem] bg-linear-to-br p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:min-h-56",
        theme.bg,
        className,
      )}
    >
      <span className="relative z-10 text-3xl" aria-hidden>
        {collection.emoji}
      </span>
      <h3 className="relative z-10 mt-2 font-display text-xl leading-tight font-bold sm:text-2xl">{collection.name}</h3>
      <p className="relative z-10 mt-1 max-w-[80%] text-sm text-ink-soft">{collection.tagline}</p>
      <span className={cn("relative z-10 mt-auto inline-flex items-center gap-1 pt-4 text-sm font-extrabold", theme.accent)}>
        {items.length ? pluralise(items.length, "piece") : "Coming soon"}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
      </span>
      {cover && (
        <span className="pointer-events-none absolute -right-5 -bottom-5 w-24 rotate-12 opacity-90 transition duration-500 group-hover:rotate-0 group-hover:scale-110 sm:w-28" aria-hidden>
          <ProductImage image={cover} alt="" sizes="160px" className="h-auto w-full rounded-3xl object-contain shadow-soft" />
        </span>
      )}
    </Link>
  );
}
