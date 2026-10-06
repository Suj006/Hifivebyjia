import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CouponToggle } from "@/components/admin/CouponToggle";
import { EmptyNote, PageHeader, Pill } from "@/components/admin/ui";
import { DISCOUNT_STATE_INFO, discountState } from "@/lib/discount-status";
import { formatDateTime } from "@/lib/format";
import { describeDiscount } from "@/lib/pricing";
import { listDiscounts } from "@/server/admin-data";

export const metadata: Metadata = { title: "Coupons & offers" };

export default async function CouponsPage() {
  const discounts = await listDiscounts();
  return (
    <>
      <PageHeader
        title="Coupons & offers"
        description="Coupon codes customers type in the cart, and automatic offers that apply by themselves."
        actions={
          <Link href="/admin/coupons/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> New coupon
          </Link>
        }
      />
      {discounts.length ? (
        <ul className="space-y-2">
          {discounts.map((d) => {
            const state = DISCOUNT_STATE_INFO[discountState(d)];
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-sm sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/coupons/${d.id}`} className="font-display text-lg font-bold hover:text-pink-deep">
                      {d.code ?? d.label}
                    </Link>
                    <Pill tone={state.tone}>{state.label}</Pill>
                    {d.automatic && <Pill tone="purple">Automatic</Pill>}
                    {d.promote && <Pill tone="yellow">Shown in cart</Pill>}
                  </div>
                  <p className="text-sm text-ink-soft">
                    {d.code ? `${d.label} · ` : ""}
                    {describeDiscount(d)}
                    {d.maximumDiscount && d.valueType !== "percentage" ? ` · max ₹${d.maximumDiscount}` : ""}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {d.startsAt ? `From ${formatDateTime(d.startsAt)}` : "No start date"} · {d.endsAt ? `until ${formatDateTime(d.endsAt)}` : "no end date"} · Used{" "}
                    {d.usageCount ?? 0}
                    {d.usageLimit ? ` / ${d.usageLimit}` : ""} times
                  </p>
                </div>
                <CouponToggle id={d.id} active={d.active} />
                <Link href={`/admin/coupons/${d.id}`} className="btn btn-secondary btn-sm">
                  Edit
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote>No coupons yet. Create one to run a sale or welcome offer.</EmptyNote>
      )}
    </>
  );
}
