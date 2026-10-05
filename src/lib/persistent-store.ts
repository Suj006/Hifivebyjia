/**
 * Tiny localStorage-backed store for `useSyncExternalStore`.
 *
 * Phase 1 persists cart, saved-for-later and wishlist on the device.
 * Phase 2 can sync the same state with a customer account by subscribing to
 * changes and calling the API — components keep using the same hooks.
 */

type Listener = () => void;
type Updater<T> = T | ((prev: T) => T);

export interface PersistentStore<T> {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: Listener) => () => void;
  set: (updater: Updater<T>) => void;
}

export function createPersistentStore<T>(
  key: string,
  initial: T,
  sanitize: (raw: unknown) => T = (raw) => raw as T,
): PersistentStore<T> {
  let state = initial;
  let loaded = false;
  const listeners = new Set<Listener>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = sanitize(JSON.parse(raw));
    } catch {
      state = initial;
    }
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    getSnapshot: () => {
      load();
      return state;
    },
    getServerSnapshot: () => initial,
    subscribe: (listener) => {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        loaded = false;
        load();
        emit();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    set: (updater) => {
      load();
      state = typeof updater === "function" ? (updater as (p: T) => T)(state) : updater;
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* storage full or blocked – keep in memory */
      }
      emit();
    },
  };
}

export const STORAGE_KEYS = {
  cart: "h5.cart.v1",
  wishlist: "h5.wishlist.v1",
  reviews: "h5.reviews.pending.v1",
  notify: "h5.notify.v1",
  orders: "h5.orders.v1",
} as const;
