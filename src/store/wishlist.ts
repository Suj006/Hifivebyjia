"use client";

import { useSyncExternalStore } from "react";
import { createPersistentStore, STORAGE_KEYS } from "@/lib/persistent-store";
import type { WishlistItem } from "@/types";

// Items for products that no longer exist are simply skipped when shown.
const store = createPersistentStore<WishlistItem[]>(STORAGE_KEYS.wishlist, [], (raw) =>
  Array.isArray(raw) ? raw.filter((i): i is WishlistItem => i && typeof i.productId === "string") : [],
);

export const wishlistActions = {
  toggle(productId: string): boolean {
    let added = false;
    store.set((items) => {
      if (items.some((i) => i.productId === productId)) return items.filter((i) => i.productId !== productId);
      added = true;
      return [{ productId, addedAt: new Date().toISOString() }, ...items];
    });
    return added;
  },
  remove(productId: string) {
    store.set((items) => items.filter((i) => i.productId !== productId));
  },
};

export function useWishlist() {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    items,
    count: items.length,
    has: (productId: string) => items.some((i) => i.productId === productId),
    ...wishlistActions,
  };
}
