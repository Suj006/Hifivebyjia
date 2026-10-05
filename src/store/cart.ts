"use client";

import { useMemo, useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import { getProductMap } from "@/lib/catalog";
import { createPersistentStore, STORAGE_KEYS } from "@/lib/persistent-store";
import { calculateTotals } from "@/lib/pricing";
import { useOrderHistory } from "@/store/records";
import type { CartLine, CustomisationValues, SavedItem } from "@/types";

export interface CartState {
  lines: CartLine[];
  saved: SavedItem[];
  couponCode: string | null;
}

const EMPTY: CartState = { lines: [], saved: [], couponCode: null };
const MAX_QTY = siteConfig.commerce.maxQuantityPerLine;

const clampQty = (q: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(q) || 1)));

function sanitize(raw: unknown): CartState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Partial<CartState>;
  const products = getProductMap();
  const validLine = (l: CartLine | SavedItem) =>
    l && typeof l.lineId === "string" && typeof l.productId === "string" && products[l.productId];
  return {
    lines: Array.isArray(r.lines) ? r.lines.filter(validLine).map((l) => ({ ...l, quantity: clampQty(l.quantity) })) : [],
    saved: Array.isArray(r.saved) ? r.saved.filter(validLine).map((l) => ({ ...l, quantity: clampQty(l.quantity) })) : [],
    couponCode: typeof r.couponCode === "string" ? r.couponCode : null,
  };
}

const store = createPersistentStore<CartState>(STORAGE_KEYS.cart, EMPTY, sanitize);

/** Stable id per product + customisation so identical picks merge. */
export function makeLineId(productId: string, customisation?: CustomisationValues) {
  const entries = Object.entries(customisation ?? {})
    .filter(([, v]) => v?.trim())
    .sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return productId;
  const key = entries.map(([k, v]) => `${k}=${v.trim()}`).join("|");
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `${productId}__${hash.toString(36)}`;
}

const cleanCustomisation = (c?: CustomisationValues) => {
  if (!c) return undefined;
  const out = Object.fromEntries(Object.entries(c).filter(([, v]) => v?.trim()).map(([k, v]) => [k, v.trim()]));
  return Object.keys(out).length ? out : undefined;
};

export const cartActions = {
  add(productId: string, quantity = 1, customisation?: CustomisationValues) {
    const custom = cleanCustomisation(customisation);
    const lineId = makeLineId(productId, custom);
    store.set((s) => {
      const existing = s.lines.find((l) => l.lineId === lineId);
      const lines = existing
        ? s.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: clampQty(l.quantity + quantity) } : l))
        : [...s.lines, { lineId, productId, quantity: clampQty(quantity), customisation: custom, addedAt: new Date().toISOString() }];
      return { ...s, lines };
    });
  },
  setQuantity(lineId: string, quantity: number) {
    store.set((s) => ({ ...s, lines: s.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: clampQty(quantity) } : l)) }));
  },
  remove(lineId: string) {
    store.set((s) => ({ ...s, lines: s.lines.filter((l) => l.lineId !== lineId) }));
  },
  saveForLater(lineId: string) {
    store.set((s) => {
      const line = s.lines.find((l) => l.lineId === lineId);
      if (!line) return s;
      const saved = s.saved.filter((x) => x.lineId !== lineId);
      return {
        ...s,
        lines: s.lines.filter((l) => l.lineId !== lineId),
        saved: [{ lineId, productId: line.productId, quantity: line.quantity, customisation: line.customisation, savedAt: new Date().toISOString() }, ...saved],
      };
    });
  },
  moveToCart(lineId: string) {
    store.set((s) => {
      const item = s.saved.find((x) => x.lineId === lineId);
      if (!item) return s;
      const existing = s.lines.find((l) => l.lineId === lineId);
      const lines = existing
        ? s.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: clampQty(l.quantity + item.quantity) } : l))
        : [...s.lines, { lineId, productId: item.productId, quantity: item.quantity, customisation: item.customisation, addedAt: new Date().toISOString() }];
      return { ...s, lines, saved: s.saved.filter((x) => x.lineId !== lineId) };
    });
  },
  removeSaved(lineId: string) {
    store.set((s) => ({ ...s, saved: s.saved.filter((x) => x.lineId !== lineId) }));
  },
  applyCoupon(code: string) {
    store.set((s) => ({ ...s, couponCode: code.trim().toUpperCase() || null }));
  },
  removeCoupon() {
    store.set((s) => ({ ...s, couponCode: null }));
  },
  clearCart() {
    store.set((s) => ({ ...s, lines: [], couponCode: null }));
  },
};

export function useCartState(): CartState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useCart() {
  const state = useCartState();
  const orders = useOrderHistory();
  const totals = useMemo(
    () => calculateTotals(state.lines, getProductMap(), state.couponCode, { isFirstOrder: orders.length === 0 }),
    [state.lines, state.couponCode, orders.length],
  );
  const count = state.lines.reduce((s, l) => s + l.quantity, 0);
  return { ...state, totals, count, ...cartActions };
}

export function useCartCount() {
  const state = useCartState();
  return state.lines.reduce((s, l) => s + l.quantity, 0);
}
