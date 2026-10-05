"use client";

import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  tone?: "success" | "info" | "error";
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(t: Omit<Toast, "id">) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { ...t, id }];
  emit();
  setTimeout(() => dismissToast(id), 3800);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const EMPTY: Toast[] = [];

export const useToasts = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );

/* Search overlay open state */
let searchOpen = false;
const searchListeners = new Set<() => void>();
export const setSearchOpen = (open: boolean) => {
  searchOpen = open;
  searchListeners.forEach((l) => l());
};
export const useSearchOpen = () =>
  useSyncExternalStore(
    (l) => {
      searchListeners.add(l);
      return () => searchListeners.delete(l);
    },
    () => searchOpen,
    () => false,
  );
