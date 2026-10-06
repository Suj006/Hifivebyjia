"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PriceTag } from "@/components/product/PriceTag";
import { ProductBadges } from "@/components/product/ProductBadges";
import { ProductImage } from "@/components/product/ProductImage";
import { microcopy } from "@/content/brand";
import { isComingSoon, isPurchasable } from "@/lib/catalog";
import { useStore } from "@/store/store-context";
import { cartActions } from "@/store/cart";
import { useHydrated } from "@/store/records";
import { toast } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";

export function WishlistView() {
  const hydrated = useHydrated();
  const wishlist = useWishlist();
  const { productMap } = useStore();
  const items = wishlist.items.filter((i) => productMap[i.productId]);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true" aria-label="Loading wishlist">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <EmptyState mood="happy" title={microcopy.emptyWishlistTitle} text={microcopy.emptyWishlistText} action={{ label: "Explore Products", href: "/shop" }} />;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {items.map((item) => {
        const product = productMap[item.productId];
        if (!product) return null;
        const needsOptions = product.customisation?.some((f) => f.required);
        const purchasable = isPurchasable(product);
        return (
          <li key={item.productId} className="card flex flex-col overflow-hidden">
            <Link href={`/products/${product.slug}`} className="relative aspect-square bg-pink-soft/40">
              <ProductImage image={product.images[0]} alt={product.name} sizes="(min-width: 1024px) 25vw, 50vw" />
              <ProductBadges product={product} className="absolute top-3 left-3" />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <Link href={`/products/${product.slug}`} className="font-display text-lg font-semibold hover:text-pink-deep">
                {product.name}
              </Link>
              {!isComingSoon(product) && <PriceTag product={product} size="sm" />}
              <div className="mt-auto space-y-2 pt-2">
                {purchasable && !needsOptions && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm w-full"
                    onClick={() => {
                      cartActions.add(product.id, 1);
                      wishlist.remove(product.id);
                      toast({ title: "Moved to cart! ✋", description: product.name, action: { label: "View cart", href: "/cart" } });
                    }}
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden /> Move to cart
                  </button>
                )}
                {purchasable && needsOptions && (
                  <Link href={`/products/${product.slug}`} className="btn btn-primary btn-sm w-full">
                    Choose options
                  </Link>
                )}
                {!purchasable && (
                  <Link href={`/products/${product.slug}`} className="btn btn-secondary btn-sm w-full">
                    {isComingSoon(product) ? "Notify me" : "Sold out · Notify me"}
                  </Link>
                )}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1 py-1 text-sm font-bold text-ink-soft hover:text-pink-deep"
                  onClick={() => wishlist.remove(product.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Remove
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
