import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { microcopy } from "@/content/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Cart",
  description: "Review your Hi Five by Jia picks, apply a coupon and check out.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Your cart</h1>
      <p className="mt-2 text-lg text-ink-soft">{microcopy.cartTitle}</p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
