import Link from "next/link";
import { Heart } from "@/components/brand/Heart";
import { Sparkle } from "@/components/brand/Decor";
import { NotifyMeForm } from "@/components/forms/NotifyMeForm";
import { ProductImage } from "@/components/product/ProductImage";
import { formatDate } from "@/lib/format";
import type { Product } from "@/types";

export function ComingSoonCard({ product }: { product: Product }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-grape-soft">
        <ProductImage
          image={product.images[0]}
          alt={product.images[0].alt}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
        <span className="chip absolute top-3 left-3 bg-grape text-white shadow-sm">✨ Coming soon</span>
        <Sparkle className="absolute top-4 right-6 h-6 w-6 animate-sparkle" color="#FAAF04" />
        <span className="absolute right-14 bottom-6 animate-float" aria-hidden><Heart className="h-5 w-5" /></span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold">
          <Link href={`/products/${product.slug}`} className="hover:text-pink-deep">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-bold text-grape-deep">
          {product.launchDate ? `Expected ${formatDate(product.launchDate)}` : product.launchLabel ?? "Coming soon"}
        </p>
        <p className="mt-2 flex-1 text-sm text-ink-soft">{product.shortDescription}</p>
        <NotifyMeForm productId={product.id} compact className="mt-4" />
      </div>
    </article>
  );
}
