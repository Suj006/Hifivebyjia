import type { Review } from "@/types";

/**
 * Review helpers. Inputs are the approved reviews from the store — pending or
 * rejected reviews never reach the storefront.
 */
export const reviewsForProduct = (reviews: Review[], productId: string) =>
  reviews.filter((r) => r.status === "approved" && r.productId === productId);

export function featuredReviews(reviews: Review[], limit = 6): Review[] {
  const approved = reviews.filter((r) => r.status === "approved");
  const featured = approved.filter((r) => r.featured);
  return (featured.length ? featured : approved).slice(0, limit);
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function summarizeReviews(list: Review[]): RatingSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary["distribution"];
  for (const r of list) distribution[r.rating]++;
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { average, count, distribution };
}

export function ratingSummaries(reviews: Review[]): Record<string, RatingSummary> {
  const byProduct: Record<string, Review[]> = {};
  for (const r of reviews) if (r.status === "approved") (byProduct[r.productId] ??= []).push(r);
  return Object.fromEntries(Object.entries(byProduct).map(([id, list]) => [id, summarizeReviews(list)]));
}
