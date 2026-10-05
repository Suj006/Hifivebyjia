import { isComingSoon, isSoldOut } from "@/lib/catalog";
import { discountPercent, cn } from "@/lib/format";
import type { Product } from "@/types";

export function ProductBadges({ product, className }: { product: Product; className?: string }) {
  const badges: { label: string; className: string }[] = [];
  const pct = product.discountPercentage ?? discountPercent(product.price, product.compareAtPrice);

  if (isComingSoon(product)) badges.push({ label: "✨ Coming soon", className: "bg-grape text-white" });
  else if (isSoldOut(product)) badges.push({ label: "Sold out", className: "bg-ink text-white" });
  else {
    if (pct > 0) badges.push({ label: `${pct}% OFF`, className: "bg-pink-deep text-white" });
    if (product.newArrival) badges.push({ label: "New", className: "bg-sunny text-ink" });
    if (product.bestseller) badges.push({ label: "Bestseller", className: "bg-sky-deep text-white" });
    if (product.customisable && product.tags.includes("personalised")) badges.push({ label: "Personalise", className: "bg-mint text-ink" });
  }

  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.slice(0, 2).map((b) => (
        <span key={b.label} className={cn("chip shadow-sm", b.className)}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function SampleTag({ className }: { className?: string }) {
  return (
    <span className={cn("chip border border-dashed border-ink-soft/40 bg-white/90 text-ink-soft", className)} title="Sample listing to preview upcoming designs">
      Sample
    </span>
  );
}
