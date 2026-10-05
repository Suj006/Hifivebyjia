"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Tag, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { cn, formatPrice } from "@/lib/format";
import { getPromotedCoupons } from "@/lib/pricing";
import { cartActions } from "@/store/cart";
import type { CartTotals } from "@/types";

export function CouponForm({ couponCode, error }: { couponCode: string | null; error?: string }) {
  const [code, setCode] = useState("");
  const promoted = getPromotedCoupons();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    cartActions.applyCoupon(code);
    track("apply_coupon", { coupon: code.trim().toUpperCase() });
    setCode("");
  }

  if (couponCode) {
    return (
      <div>
        <div className={cn("flex items-center justify-between rounded-2xl px-4 py-3", error ? "bg-pink-soft" : "bg-mint-soft")}>
          <span className={cn("flex items-center gap-2 font-bold", error ? "text-pink-deep" : "text-mint-deep")}>
            <Tag className="h-4 w-4" aria-hidden /> {couponCode}
          </span>
          <button type="button" onClick={() => cartActions.removeCoupon()} className="flex items-center gap-1 text-sm font-bold text-ink-soft hover:text-pink-deep">
            <X className="h-4 w-4" aria-hidden /> Remove
          </button>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label htmlFor="coupon" className="label">
        Have a coupon?
      </label>
      <div className="flex gap-2">
        <input id="coupon" className="input uppercase" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        <button type="submit" className="btn btn-secondary shrink-0 px-5" disabled={!code.trim()}>
          Apply
        </button>
      </div>
      {promoted[0] && (
        <p className="text-xs text-ink-soft">
          Psst… try <strong className="text-pink-deep">{promoted[0].code}</strong> — {promoted[0].description}
        </p>
      )}
    </form>
  );
}

function Row({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <dt>{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

export function TotalsList({ totals }: { totals: CartTotals }) {
  const threshold = siteConfig.shipping.freeShippingThreshold;
  const progress = threshold ? Math.min(100, ((totals.subtotal - totals.discountTotal) / threshold) * 100) : 100;

  return (
    <div>
      {totals.freeShippingRemaining > 0 && (
        <div className="mb-5 rounded-2xl bg-sunny-soft p-4">
          <p className="text-sm font-bold">
            Add {formatPrice(totals.freeShippingRemaining)} more for <span className="text-pink-deep">free shipping</span> 🚚
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free shipping">
            <div className="h-full rounded-full bg-linear-to-r from-pink to-sunny transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <dl className="space-y-3 text-ink">
        <Row label={`Subtotal (${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"})`} value={formatPrice(totals.subtotal)} />
        {totals.discounts.map((d) => (
          <Row
            key={d.discountId}
            label={<span className="text-mint-deep">Discount {d.code ? `(${d.code})` : `· ${d.label}`}</span>}
            value={<span className="text-mint-deep">−{formatPrice(d.amount)}</span>}
          />
        ))}
        {totals.discounts.length === 0 && <Row label="Discount" value={formatPrice(0)} className="text-ink-soft" />}
        <Row label="Shipping estimate" value={totals.shipping ? formatPrice(totals.shipping) : totals.shippingLabel} />
        <Row
          label="Estimated tax (GST)"
          value={siteConfig.tax.enabled ? (siteConfig.tax.pricesIncludeTax ? `${formatPrice(totals.tax)} incl.` : formatPrice(totals.tax)) : <span className="text-ink-soft">{totals.taxLabel}</span>}
        />
        <div className="border-t border-dashed border-line pt-3">
          <Row label={<span className="font-display text-lg font-bold">Estimated total</span>} value={<span className="font-display text-2xl font-bold">{formatPrice(totals.total)}</span>} />
        </div>
      </dl>
      {totals.discountTotal > 0 && (
        <p className="mt-3 rounded-xl bg-mint-soft px-3 py-2 text-center text-sm font-bold text-mint-deep">
          Yay! You’re saving {formatPrice(totals.discountTotal)} 🎉
        </p>
      )}
      <p className="mt-3 text-xs text-ink-soft">{siteConfig.shipping.estimateNote}</p>
    </div>
  );
}
