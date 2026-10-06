"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setDiscountActive } from "@/server/actions/discounts";
import { cn } from "@/lib/format";

/** On/off switch for a coupon in the list. */
export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Switch off" : "Switch on"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setDiscountActive(id, !active);
          router.refresh();
        })
      }
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition", active ? "bg-mint" : "bg-line", pending && "opacity-60")}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", active ? "left-6" : "left-1")} />
    </button>
  );
}
