import { reviews } from "@/data/reviews";
import type { Review } from "@/types";

/** Only approved reviews are ever public. */
export const isPublic = (r: Review) => r.status === "approved";

export function getApprovedReviews(productId?: string): Review[] {
  return reviews
    .filter(isPublic)
    .filter((r) => !productId || r.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getFeaturedReviews(limit = 6): Review[] {
  const approved = getApprovedReviews();
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

export function getRatingSummaries(): Record<string, RatingSummary> {
  const byProduct: Record<string, Review[]> = {};
  for (const r of getApprovedReviews()) (byProduct[r.productId] ??= []).push(r);
  return Object.fromEntries(Object.entries(byProduct).map(([id, list]) => [id, summarizeReviews(list)]));
}
