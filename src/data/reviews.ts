import type { Review } from "@/types";

/**
 * Published customer reviews (Phase 1).
 *
 * Workflow: customer submits → status "pending" → you approve → review appears.
 * Submissions arrive via the forms webhook (see README). To publish one, copy it
 * here with `status: "approved"`. Only approved reviews are ever shown.
 *
 * Never add made-up reviews or ratings. This list is intentionally empty until
 * genuine customer reviews are received.
 *
 * Example entry:
 * {
 *   id: "r-0001",
 *   productId: "p-bead-bracelet",
 *   name: "Ananya",
 *   rating: 5,
 *   text: "…",
 *   createdAt: "2026-10-12T10:00:00.000Z",
 *   status: "approved",
 * }
 */
export const reviews: Review[] = [];
