"use client";

/**
 * Device-local records for Phase 1: pending reviews, notify-me sign-ups and
 * order requests. They let customers see the state of what they submitted
 * (e.g. "your review is pending approval") without a backend.
 * Phase 2 replaces these with API calls behind `src/lib/repositories`.
 */
import { useSyncExternalStore } from "react";
import { createPersistentStore, STORAGE_KEYS } from "@/lib/persistent-store";
import type { NotifyRequest, OrderRequest, Review } from "@/types";

const asArray = <T,>(raw: unknown): T[] => (Array.isArray(raw) ? (raw as T[]) : []);

export const localReviewsStore = createPersistentStore<Review[]>(STORAGE_KEYS.reviews, [], asArray<Review>);
export const notifyStore = createPersistentStore<NotifyRequest[]>(STORAGE_KEYS.notify, [], asArray<NotifyRequest>);
export const ordersStore = createPersistentStore<OrderRequest[]>(STORAGE_KEYS.orders, [], asArray<OrderRequest>);

export const useLocalReviews = () =>
  useSyncExternalStore(localReviewsStore.subscribe, localReviewsStore.getSnapshot, localReviewsStore.getServerSnapshot);

export const useNotifyRequests = () =>
  useSyncExternalStore(notifyStore.subscribe, notifyStore.getSnapshot, notifyStore.getServerSnapshot);

export const useOrderHistory = () =>
  useSyncExternalStore(ordersStore.subscribe, ordersStore.getSnapshot, ordersStore.getServerSnapshot);

const noopSubscribe = () => () => {};

/** False during SSR/hydration, true once running in the browser. */
export const useHydrated = () =>
  useSyncExternalStore(noopSubscribe, () => true, () => false);
