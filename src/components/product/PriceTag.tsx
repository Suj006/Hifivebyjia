import { discountPercent, formatPrice, cn } from "@/lib/format";
import type { Product } from "@/types";

interface PriceTagProps {
  product: Pick<Product, "price" | "compareAtPrice" | "discountPercentage">;
  size?: "sm" | "md" | "lg";
  showSavings?: boolean;
  className?: string;
}

export function PriceTag({ product, size = "md", showSavings, className }: PriceTagProps) {
  const pct = product.discountPercentage ?? discountPercent(product.price, product.compareAtPrice);
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const savings = onSale ? product.compareAtPrice! - product.price : 0;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-display font-bold text-ink",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-3xl sm:text-4xl",
        )}
      >
        <span className="sr-only">{onSale ? "Now " : "Price "}</span>
        {formatPrice(product.price)}
      </span>
      {onSale && (
        <>
          <span className={cn("text-ink-soft line-through", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Originally </span>
            {formatPrice(product.compareAtPrice!)}
          </span>
          {pct > 0 && <span className="chip bg-pink-soft text-pink-deep">{pct}% OFF</span>}
        </>
      )}
      {onSale && showSavings && (
        <span className="w-full text-sm font-bold text-mint-deep">You save {formatPrice(savings)}</span>
      )}
    </div>
  );
}
