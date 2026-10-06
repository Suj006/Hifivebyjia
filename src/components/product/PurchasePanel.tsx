"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Gift, Hand, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { NotifyMeForm } from "@/components/forms/NotifyMeForm";
import { PriceTag } from "@/components/product/PriceTag";
import { WishlistButton } from "@/components/product/WishlistButton";
import { siteConfig } from "@/config/site";
import { microcopy } from "@/content/brand";
import { track } from "@/lib/analytics";
import { isComingSoon, isPurchasable, isSoldOut } from "@/lib/catalog";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { unitPriceFor } from "@/lib/pricing";
import { hasErrors, validateCustomisation, type FieldErrors } from "@/lib/validation";
import { buildProductEnquiry, isWhatsAppConfigured, whatsappLink } from "@/lib/whatsapp";
import { cartActions } from "@/store/cart";
import { useStore } from "@/store/store-context";
import { toast } from "@/store/ui";
import type { CustomisationValues, Product } from "@/types";

export function QuantityStepper({
  value,
  onChange,
  max = siteConfig.commerce.maxQuantityPerLine,
  label = "Quantity",
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const btn = cn("grid place-items-center rounded-full transition hover:bg-pink-soft disabled:opacity-40", size === "sm" ? "h-9 w-9" : "h-11 w-11");
  return (
    <div className="inline-flex items-center rounded-full border-2 border-line bg-white" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
        className={cn("[appearance:textfield] bg-transparent text-center font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none", size === "sm" ? "w-8" : "w-10")}
        aria-label={label}
      />
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function PurchasePanel({ product }: { product: Product }) {
  const id = useId();
  const { settings } = useStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<CustomisationValues>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [qty, setQty] = useState(1);
  const [showSticky, setShowSticky] = useState(false);

  const purchasable = isPurchasable(product);
  const comingSoon = isComingSoon(product);
  const soldOut = isSoldOut(product);
  const unit = unitPriceFor(product, values);
  const maxQty = Math.min(siteConfig.commerce.maxQuantityPerLine, Math.max(1, product.stock));

  useEffect(() => {
    track("view_item", { item_id: product.id, item_name: product.name, value: product.price, currency: "INR" });
  }, [product.id, product.name, product.price]);

  // Show the sticky mobile bar once the add-to-cart form has scrolled above the viewport.
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShowSticky(el.getBoundingClientRect().bottom < 0));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  function addToCart(e?: FormEvent) {
    e?.preventDefault();
    if (!purchasable) return;
    const errs = validateCustomisation(product.customisation, values);
    setErrors(errs);
    if (hasErrors(errs)) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const first = Object.keys(errs)[0];
      setTimeout(() => document.getElementById(`${id}-${first}`)?.focus(), 350);
      return;
    }
    cartActions.add(product.id, qty, values);
    track("add_to_cart", { item_id: product.id, item_name: product.name, value: unit * qty, currency: "INR", quantity: qty });
    toast({ title: "Added to cart! ✋", description: `${product.name} × ${qty}`, action: { label: "View cart", href: "/cart" } });
  }

  const set = (field: string, v: string) => {
    setValues((s) => ({ ...s, [field]: v }));
    if (errors[field]) setErrors((s) => ({ ...s, [field]: undefined }));
  };

  return (
    <div>
      <PriceTag product={{ ...product, price: unit }} size="lg" showSavings />
      {!siteConfig.tax.enabled && <p className="mt-1 text-xs text-ink-soft">Shipping calculated in cart · Taxes, if any, confirmed with your order</p>}

      <p className="mt-5 text-lg text-ink-soft">{product.shortDescription}</p>

      {product.isSample && (
        <p className="mt-4 rounded-2xl border border-dashed border-ink-soft/30 bg-white px-4 py-3 text-sm text-ink-soft">
          <strong className="text-ink">Sample listing:</strong> this design previews upcoming styles for grown-ups and gifting. Message us to check availability.
        </p>
      )}

      {comingSoon && (
        <div className="mt-6 rounded-3xl bg-grape-soft p-5">
          <p className="font-display text-xl font-bold text-grape-deep">✨ {microcopy.comingSoon}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {product.launchDate ? `Expected ${formatDate(product.launchDate)}.` : product.launchLabel ?? "Launching soon."} This product can’t be ordered yet.
          </p>
          <NotifyMeForm productId={product.id} className="mt-4" />
        </div>
      )}

      {soldOut && (
        <div className="mt-6 rounded-3xl bg-pink-soft p-5">
          <p className="font-display text-xl font-bold text-pink-deep">{microcopy.soldOut}</p>
          <p className="mt-1 text-sm text-ink-soft">It’s sold out right now. Leave your email and we’ll tell you when it’s back.</p>
          <NotifyMeForm productId={product.id} className="mt-4" />
        </div>
      )}

      {purchasable && (
        <form ref={formRef} onSubmit={addToCart} noValidate className="mt-6 space-y-5">
          {product.customisation?.map((f) => (
            <div key={f.id}>
              <label htmlFor={`${id}-${f.id}`} className="label">
                {f.label}
                {f.required ? <span className="text-pink-deep"> *</span> : <span className="font-normal text-ink-soft"> (optional)</span>}
                {f.priceAdjustment ? <span className="font-normal text-ink-soft"> +{formatPrice(f.priceAdjustment)}</span> : null}
              </label>
              {f.type === "select" ? (
                f.options && f.options.length <= 5 ? (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`${id}-${f.id}-legend`} id={`${id}-${f.id}`} tabIndex={-1}>
                    <span id={`${id}-${f.id}-legend`} className="sr-only">
                      {f.label}
                    </span>
                    {f.options.map((o) => (
                      <button
                        key={o}
                        type="button"
                        role="radio"
                        aria-checked={values[f.id] === o}
                        onClick={() => set(f.id, o)}
                        className={cn(
                          "rounded-full border-2 px-4 py-2 text-sm font-bold transition",
                          values[f.id] === o ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-line bg-white hover:border-pink",
                        )}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select id={`${id}-${f.id}`} className="input" value={values[f.id] ?? ""} onChange={(e) => set(f.id, e.target.value)} aria-invalid={Boolean(errors[f.id])}>
                    <option value="">Choose…</option>
                    {f.options?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                )
              ) : f.type === "textarea" ? (
                <textarea
                  id={`${id}-${f.id}`}
                  className="input min-h-24"
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  value={values[f.id] ?? ""}
                  onChange={(e) => set(f.id, e.target.value)}
                  aria-invalid={Boolean(errors[f.id])}
                />
              ) : (
                <input
                  id={`${id}-${f.id}`}
                  className="input font-display text-lg tracking-widest uppercase"
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  value={values[f.id] ?? ""}
                  onChange={(e) => set(f.id, e.target.value.toUpperCase())}
                  aria-invalid={Boolean(errors[f.id])}
                  aria-describedby={f.helpText ? `${id}-${f.id}-help` : undefined}
                  autoComplete="off"
                />
              )}
              {f.helpText && !errors[f.id] && (
                <p id={`${id}-${f.id}-help`} className="mt-1.5 text-xs text-ink-soft">
                  {f.helpText}
                  {f.maxLength && f.type === "text" ? ` (${(values[f.id] ?? "").length}/${f.maxLength})` : ""}
                </p>
              )}
              {errors[f.id] && (
                <p className="field-error" role="alert">
                  {errors[f.id]}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={maxQty} />
            {product.stock > 0 && product.stock <= 5 && <span className="text-sm font-bold text-tangerine-deep">Only {product.stock} left!</span>}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="btn btn-primary flex-1 text-lg">
              <ShoppingBag className="h-5 w-5" aria-hidden /> Add to cart · {formatPrice(unit * qty)}
            </button>
            <WishlistButton product={product} variant="full" className="sm:flex-none" />
          </div>
        </form>
      )}

      {!purchasable && (
        <div className="mt-4">
          <WishlistButton product={product} variant="full" className="w-full sm:w-auto" />
        </div>
      )}

      {isWhatsAppConfigured(settings.whatsappNumber) && (
        <a href={whatsappLink(settings.whatsappNumber, buildProductEnquiry(product))} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0f7a41] hover:underline">
          <WhatsAppIcon className="h-4 w-4" /> Questions? Ask us on WhatsApp
        </a>
      )}

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Hand, title: "Handmade", text: "Made with care, one bead at a time" },
          { icon: Truck, title: "Ships in India", text: settings.freeShippingThreshold ? `Free over ${formatPrice(settings.freeShippingThreshold)}` : "Across India" },
          { icon: Gift, title: "Gift-ready", text: "Packed in a Hi Five pouch" },
        ].map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-col sm:gap-2">
            <Icon className="h-5 w-5 shrink-0 text-pink-deep" aria-hidden />
            <span>
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-xs text-ink-soft">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Sticky add-to-cart (mobile) */}
      {purchasable && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 backdrop-blur transition-transform duration-300 lg:hidden",
            showSticky ? "translate-y-0" : "translate-y-full",
          )}
          aria-hidden={!showSticky}
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{product.name}</p>
              <p className="font-display text-lg font-bold">{formatPrice(unit * qty)}</p>
            </div>
            <button type="button" onClick={() => addToCart()} className="btn btn-primary" tabIndex={showSticky ? 0 : -1}>
              <ShoppingBag className="h-5 w-5" aria-hidden /> Add to cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
