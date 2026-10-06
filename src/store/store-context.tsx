"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { toProductMap } from "@/lib/catalog";
import { ratingSummaries, type RatingSummary } from "@/lib/reviews";
import type { Product, StoreData } from "@/types";

interface StoreContextValue extends StoreData {
  productMap: Record<string, Product>;
  ratings: Record<string, RatingSummary>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** Makes the storefront data (products, collections, settings…) available to client components. */
export function StoreProvider({ store, children }: { store: StoreData; children: ReactNode }) {
  const value = useMemo(
    () => ({ ...store, productMap: toProductMap(store.products), ratings: ratingSummaries(store.reviews) }),
    [store],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
