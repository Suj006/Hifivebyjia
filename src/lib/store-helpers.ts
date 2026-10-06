import { ratingSummaries } from "@/lib/reviews";
import type { StoreData } from "@/types";

/** Props every product grid needs (category labels + approved-review ratings). */
export const gridContext = (store: StoreData) => ({
  categories: store.categories,
  ratings: ratingSummaries(store.reviews),
});
