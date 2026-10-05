"use client";

import { Heart } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/format";
import { toast } from "@/store/ui";
import { useHydrated } from "@/store/records";
import { useWishlist } from "@/store/wishlist";
import type { Product } from "@/types";

interface Props {
  product: Product;
  className?: string;
  variant?: "icon" | "full";
}

export function WishlistButton({ product, className, variant = "icon" }: Props) {
  const wishlist = useWishlist();
  const hydrated = useHydrated();
  const active = hydrated && wishlist.has(product.id);

  function onClick() {
    const added = wishlist.toggle(product.id);
    if (added) {
      track("add_to_wishlist", { item_id: product.id, item_name: product.name });
      toast({ title: "Added to your wishlist 💖", description: product.name, action: { label: "View wishlist", href: "/wishlist" } });
    } else {
      toast({ title: "Removed from wishlist", description: product.name, tone: "info" });
    }
  }

  if (variant === "full") {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={cn("btn btn-secondary", className)}>
        <Heart className={cn("h-5 w-5 transition", active && "fill-pink text-pink")} aria-hidden />
        {active ? "In your wishlist" : "Add to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink shadow-soft transition hover:scale-110 hover:text-pink-deep active:scale-95",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5 transition", active && "animate-pop fill-pink text-pink")} aria-hidden />
    </button>
  );
}
