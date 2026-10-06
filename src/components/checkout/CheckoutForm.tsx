"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { CreditCard, Lock, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { CouponForm, TotalsList } from "@/components/cart/OrderSummary";
import { CartSkeleton } from "@/components/cart/CartView";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductImage } from "@/components/product/ProductImage";
import { siteConfig } from "@/config/site";
import { microcopy } from "@/content/brand";
import { track } from "@/lib/analytics";
import { cn, formatPrice } from "@/lib/format";
import { buildOrderRequest, makeOrderReference, recordOrderRequest } from "@/lib/repositories";
import { INDIAN_STATES, hasErrors, validateCustomer, type FieldErrors } from "@/lib/validation";
import { buildOrderMessage, isWhatsAppConfigured, mailtoLink, whatsappLink } from "@/lib/whatsapp";
import { useCart, useRefreshCoupon } from "@/store/cart";
import { useStore } from "@/store/store-context";
import { useHydrated } from "@/store/records";
import type { CustomerDetails } from "@/types";

const EMPTY: CustomerDetails = { name: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "", notes: "" };

type FieldKey = keyof CustomerDetails;

export function CheckoutForm() {
  const id = useId();
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useCart();
  const { totals } = cart;
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<FieldKey>>({});
  const [submitting, setSubmitting] = useState(false);
  const { settings } = useStore();
  useRefreshCoupon();
  const whatsapp = isWhatsAppConfigured(settings.whatsappNumber);

  if (!hydrated || (submitting && totals.itemCount === 0)) return <CartSkeleton />;

  if (totals.itemCount === 0 && !submitting) {
    return <EmptyState mood="oops" title={microcopy.emptyCartTitle} text="Add something to your cart before checking out." action={{ label: "Explore Products", href: "/shop" }} />;
  }

  const set = (k: FieldKey, v: string) => {
    setCustomer((c) => ({ ...c, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validateCustomer(customer);
    setErrors(errs);
    if (hasErrors(errs)) {
      const first = Object.keys(errs)[0];
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    const reference = makeOrderReference();
    const order = buildOrderRequest(totals, customer, reference);
    const message = buildOrderMessage(totals, customer, reference);

    recordOrderRequest(order, cart.lines, cart.coupon?.code ?? null);
    track("whatsapp_order", { value: totals.total, currency: "INR", source: "checkout" });

    // Opened synchronously inside the submit handler so browsers allow it.
    const href = whatsapp ? whatsappLink(settings.whatsappNumber, message) : mailtoLink(`New order request ${reference}`, message);
    if (whatsapp) window.open(href, "_blank", "noopener,noreferrer");
    else window.location.href = href;

    cart.clearCart();
    router.push(`/order-confirmation?ref=${encodeURIComponent(reference)}`);
  }

  const field = (k: FieldKey) => ({
    id: `${id}-${k}`,
    name: k,
    value: customer[k] ?? "",
    "aria-invalid": Boolean(errors[k]),
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });
  const err = (k: FieldKey) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="field-error" role="alert">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <section className="card p-5 sm:p-8" aria-labelledby="details-title">
          <h2 id="details-title" className="flex items-center gap-3 font-display text-2xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-pink-deep text-base text-white">1</span> Your details
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-name`} className="label">Full name *</label>
              <input {...field("name")} className="input" autoComplete="name" maxLength={80} onChange={(e) => set("name", e.target.value)} />
              {err("name")}
            </div>
            <div>
              <label htmlFor={`${id}-mobile`} className="label">Mobile number *</label>
              <input {...field("mobile")} className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" maxLength={16} onChange={(e) => set("mobile", e.target.value)} />
              {err("mobile")}
            </div>
            <div>
              <label htmlFor={`${id}-email`} className="label">Email *</label>
              <input {...field("email")} className="input" type="email" inputMode="email" autoComplete="email" maxLength={120} onChange={(e) => set("email", e.target.value)} />
              {err("email")}
            </div>
          </div>

          <h3 className="mt-8 font-display text-xl font-bold">Delivery address</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-address`} className="label">Address *</label>
              <textarea {...field("address")} className="input min-h-24" autoComplete="street-address" maxLength={300} placeholder="House / flat, street, area, landmark" onChange={(e) => set("address", e.target.value)} />
              {err("address")}
            </div>
            <div>
              <label htmlFor={`${id}-city`} className="label">City *</label>
              <input {...field("city")} className="input" autoComplete="address-level2" maxLength={80} onChange={(e) => set("city", e.target.value)} />
              {err("city")}
            </div>
            <div>
              <label htmlFor={`${id}-state`} className="label">State *</label>
              <select {...field("state")} className="input" autoComplete="address-level1" onChange={(e) => set("state", e.target.value)}>
                <option value="">Choose your state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {err("state")}
            </div>
            <div>
              <label htmlFor={`${id}-pincode`} className="label">PIN code *</label>
              <input {...field("pincode")} className="input" inputMode="numeric" autoComplete="postal-code" maxLength={6} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
              {err("pincode")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-notes`} className="label">
                Order notes <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input {...field("notes")} className="input" maxLength={300} placeholder="Gift message, delivery instructions…" onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-8" aria-labelledby="payment-title">
          <h2 id="payment-title" className="flex items-center gap-3 font-display text-2xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-pink-deep text-base text-white">2</span> Payment
          </h2>
          <div className="mt-6 space-y-3" role="radiogroup" aria-label="Payment method">
            <div className="flex items-start gap-4 rounded-2xl border-2 border-dashed border-line bg-cream p-4 opacity-80" aria-disabled="true">
              <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-ink-soft" aria-hidden />
              <div>
                <p className="font-bold">
                  Online Payment <span className="chip ml-1 bg-grape-soft text-grape-deep">Coming soon</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">UPI, cards and netbanking are on the way. No payment details are collected on this website.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border-2 border-[#128C4B] bg-[#E9F8EF] p-4" role="radio" aria-checked="true">
              {whatsapp ? <WhatsAppIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#128C4B]" /> : <Mail className="mt-0.5 h-6 w-6 shrink-0 text-[#128C4B]" aria-hidden />}
              <div>
                <p className="font-bold">{whatsapp ? "Order via WhatsApp" : "Order by email"}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  We’ll open {whatsapp ? "WhatsApp" : "your email app"} with your order ready to send. We’ll reply to confirm availability, the final total and how to pay.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start" aria-labelledby="checkout-summary">
        <div className="card p-6">
          <h2 id="checkout-summary" className="font-display text-2xl font-bold">
            Your order
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {totals.lines
              .filter((l) => l.available)
              .map((l) => (
                <li key={l.lineId} className="flex gap-3 py-3">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pink-soft/40">
                    <ProductImage image={l.product.images[0]} alt="" sizes="64px" />
                    <span className="absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1 text-xs font-bold text-white">{l.quantity}</span>
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold">{l.product.name}</p>
                    {l.customisation && (
                      <p className="truncate text-ink-soft">
                        {Object.values(l.customisation).join(" · ")}
                      </p>
                    )}
                    <p className="text-ink-soft">
                      {l.quantity} × {formatPrice(l.unitPrice)}
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(l.lineTotal)}</p>
                </li>
              ))}
          </ul>
          <div className="mt-4">
            <CouponForm couponCode={cart.coupon?.code ?? null} error={totals.couponError} />
          </div>
          <div className="mt-5">
            <TotalsList totals={totals} />
          </div>
          <button type="submit" disabled={submitting} className={cn("btn mt-6 w-full text-lg", whatsapp ? "btn-whatsapp" : "btn-primary")}>
            {whatsapp ? <WhatsAppIcon /> : <Mail className="h-5 w-5" aria-hidden />}
            {submitting ? "Opening…" : whatsapp ? "Place order via WhatsApp" : "Place order by email"}
          </button>
          <p className="mt-3 flex items-start gap-2 text-xs text-ink-soft">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Your details are only used to confirm and deliver your order. See our{" "}
              <Link href="/privacy" className="underline">privacy policy</Link>.
            </span>
          </p>
          <p className="mt-2 text-xs text-ink-soft">Questions? Email {siteConfig.contact.email}</p>
        </div>
      </aside>
    </form>
  );
}
