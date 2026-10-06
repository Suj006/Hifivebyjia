import "server-only";
import { getStore } from "@/server/store";

/** Looks up a storefront-visible product by id. */
export async function getProductById(id: string) {
  if (!id) return undefined;
  const store = await getStore();
  return store.products.find((p) => p.id === id);
}
