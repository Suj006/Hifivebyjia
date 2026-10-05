"use client";

import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import { isComingSoon, isPurchasable } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { cartActions } from "@/store/cart";
import { toast } from "@/store/ui";
import type { Product } from "@/types";

/** Card-level add-to-cart. Products that need options link to the product page instead. */
export function QuickAddButton({ product, className }: { product: Product; className?: string }) {
  const needsOptions = product.customisation?.some((f) => f.required);

  if (isComingSoon(product)) {
    return (
      <Link href={`/products/${product.slug}`} className={cn("btn btn-secondary btn-sm w-full", className)}>
        <Sparkles className="h-4 w-4" aria-hidden /> Notify me
      </Link>
    );
  }
  if (!isPurchasable(product)) {
    return (
      <Link href={`/products/${product.slug}`} className={cn("btn btn-secondary btn-sm w-full", className)}>
        Sold out · Notify me
      </Link>
    );
  }
  if (needsOptions) {
    return (
      <Link href={`/products/${product.slug}`} className={cn("btn btn-primary btn-sm w-full", className)} aria-label={`Choose options for ${product.name}`}>
        <ShoppingBag className="h-4 w-4" aria-hidden /> <span className="sm:hidden">Options</span><span className="hidden sm:inline">Choose options</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cn("btn btn-primary btn-sm w-full", className)}
      onClick={() => {
        cartActions.add(product.id, 1);
        track("add_to_cart", { item_id: product.id, item_name: product.name, value: product.price, currency: "INR" });
        toast({ title: "Added to cart! ✋", description: product.name, action: { label: "View cart", href: "/cart" } });
      }}
    >
      <ShoppingBag className="h-4 w-4" aria-hidden /> Add to cart
    </button>
  );
}
