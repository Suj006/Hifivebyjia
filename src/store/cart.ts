"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import { createPersistentStore, STORAGE_KEYS } from "@/lib/persistent-store";
import { calculateTotals } from "@/lib/pricing";
import { useOrderHistory } from "@/store/records";
import { useStore } from "@/store/store-context";
import type { AppliedCoupon, CartLine, CustomisationValues, SavedItem } from "@/types";

export interface CartState {
  lines: CartLine[];
  saved: SavedItem[];
  coupon: AppliedCoupon | null;
}

const EMPTY: CartState = { lines: [], saved: [], coupon: null };
const MAX_QTY = siteConfig.commerce.maxQuantityPerLine;

const clampQty = (q: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(q) || 1)));

function sanitize(raw: unknown): CartState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Partial<CartState> & { couponCode?: unknown };
  const validLine = (l: CartLine | SavedItem) => l && typeof l.lineId === "string" && typeof l.productId === "string";
  let coupon: AppliedCoupon | null = null;
  if (r.coupon && typeof r.coupon === "object" && typeof r.coupon.code === "string") coupon = r.coupon;
  // Older carts stored only the code; its rule is re-fetched on the cart page.
  else if (typeof r.couponCode === "string" && r.couponCode) coupon = { code: r.couponCode, rule: null, error: "Checking code…" };
  return {
    lines: Array.isArray(r.lines) ? r.lines.filter(validLine).map((l) => ({ ...l, quantity: clampQty(l.quantity) })) : [],
    saved: Array.isArray(r.saved) ? r.saved.filter(validLine).map((l) => ({ ...l, quantity: clampQty(l.quantity) })) : [],
    coupon,
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

/** Asks the server about a coupon code (codes are never shipped to the browser). */
async function fetchCoupon(code: string): Promise<AppliedCoupon> {
  const normalised = code.trim().toUpperCase();
  try {
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalised }),
    });
    const data = (await res.json()) as Partial<AppliedCoupon> & { error?: string };
    if (!res.ok) return { code: normalised, rule: null, error: data.error ?? "Couldn’t check this code. Please try again." };
    return { code: data.code ?? normalised, rule: data.rule ?? null, error: data.error };
  } catch {
    return { code: normalised, rule: null, error: "You seem to be offline. Please try again." };
  }
}

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
  async applyCoupon(code: string) {
    if (!code.trim()) return;
    const coupon = await fetchCoupon(code);
    store.set((s) => ({ ...s, coupon }));
  },
  removeCoupon() {
    store.set((s) => ({ ...s, coupon: null }));
  },
  clearCart() {
    store.set((s) => ({ ...s, lines: [], coupon: null }));
  },
};

export function useCartState(): CartState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useCart() {
  const state = useCartState();
  const shop = useStore();
  const orders = useOrderHistory();
  const totals = useMemo(
    () =>
      calculateTotals(state.lines, shop.productMap, {
        settings: shop.settings,
        autoDiscounts: shop.autoDiscounts,
        coupon: state.coupon,
        isFirstOrder: orders.length === 0,
      }),
    [state.lines, state.coupon, shop.productMap, shop.settings, shop.autoDiscounts, orders.length],
  );
  const count = state.lines.reduce((s, l) => s + l.quantity, 0);
  return { ...state, totals, count, ...cartActions };
}

/** Re-checks the applied coupon with the server (dates, limits or rules may have changed). */
export function useRefreshCoupon() {
  const { coupon } = useCartState();
  const code = coupon?.code;
  const refresh = useCallback(async () => {
    if (!code) return;
    const fresh = await fetchCoupon(code);
    store.set((s) => (s.coupon?.code === code ? { ...s, coupon: fresh } : s));
  }, [code]);
  useEffect(() => {
    void refresh();
    // Only on mount / when the code changes.
  }, [refresh]);
}

export function useCartCount() {
  const state = useCartState();
  return state.lines.reduce((s, l) => s + l.quantity, 0);
}
