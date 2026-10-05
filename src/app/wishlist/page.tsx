import type { Metadata } from "next";
import { Heart } from "@/components/brand/Heart";
import { WishlistView } from "@/components/cart/WishlistView";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Wishlist",
  description: "Your saved Hi Five by Jia favourites.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">
        Your wishlist <Heart face className="ml-1 h-[0.9em] w-[0.9em] align-[-0.05em]" />
      </h1>
      <p className="mt-2 text-lg text-ink-soft">All the things you love, in one place.</p>
      <div className="mt-8">
        <WishlistView />
      </div>
    </div>
  );
}
