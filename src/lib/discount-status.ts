import type { Discount } from "@/types";

export type DiscountState = "active" | "scheduled" | "expired" | "off" | "used-up";

export function discountState(d: Discount, now = new Date()): DiscountState {
  if (!d.active) return "off";
  if (d.usageLimit && (d.usageCount ?? 0) >= d.usageLimit) return "used-up";
  if (d.endsAt && now > new Date(d.endsAt)) return "expired";
  if (d.startsAt && now < new Date(d.startsAt)) return "scheduled";
  return "active";
}

export const DISCOUNT_STATE_INFO: Record<DiscountState, { label: string; tone: "green" | "blue" | "grey" | "pink" | "yellow" }> = {
  active: { label: "Active", tone: "green" },
  scheduled: { label: "Scheduled", tone: "blue" },
  expired: { label: "Expired", tone: "grey" },
  off: { label: "Switched off", tone: "grey" },
  "used-up": { label: "Limit reached", tone: "pink" },
};
