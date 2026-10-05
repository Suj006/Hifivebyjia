import type { Metadata } from "next";
import { WishlistView } from "@/components/cart/WishlistView";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Wishlist",
  description: "Your saved Hi 5 by Jia favourites.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">
        Your wishlist <span aria-hidden>💖</span>
      </h1>
      <p className="mt-2 text-lg text-ink-soft">All the things you love, in one place.</p>
      <div className="mt-8">
        <WishlistView />
      </div>
    </div>
  );
}
