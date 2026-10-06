"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { CouponForm, TotalsList } from "@/components/cart/OrderSummary";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/PurchasePanel";
import { microcopy } from "@/content/brand";
import { track } from "@/lib/analytics";
import { isPurchasable } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { unitPriceFor } from "@/lib/pricing";
import { buildOrderMessage, isWhatsAppConfigured, whatsappLink } from "@/lib/whatsapp";
import { useCart, useRefreshCoupon } from "@/store/cart";
import { useStore } from "@/store/store-context";
import { useHydrated } from "@/store/records";
import { toast } from "@/store/ui";
import type { CustomisationValues, Product } from "@/types";

function CustomisationList({ product, values }: { product: Product; values?: CustomisationValues }) {
  if (!values) return null;
  const rows = (product.customisation ?? []).filter((f) => values[f.id]);
  if (!rows.length) return null;
  return (
    <dl className="mt-1 space-y-0.5 text-sm text-ink-soft">
      {rows.map((f) => (
        <div key={f.id} className="flex gap-1">
          <dt className="font-semibold">{f.label}:</dt>
          <dd className="break-all">{values[f.id]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading cart">
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-3xl bg-white" />
    </div>
  );
}

export function CartView() {
  const hydrated = useHydrated();
  const cart = useCart();
  const shop = useStore();
  useRefreshCoupon();
  const { totals } = cart;

  if (!hydrated) return <CartSkeleton />;

  const savedSection = cart.saved.length > 0 && (
    <section className="mt-12" aria-labelledby="saved-title">
      <h2 id="saved-title" className="font-display text-2xl font-bold">
        Saved for later <span className="text-ink-soft">({cart.saved.length})</span>
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {cart.saved.map((item) => {
          const product = shop.productMap[item.productId];
          if (!product) return null;
          const available = isPurchasable(product);
          return (
            <li key={item.lineId} className="card flex gap-4 p-4">
              <Link href={`/products/${product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-pink-soft/40">
                <ProductImage image={product.images[0]} alt={product.name} sizes="80px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${product.slug}`} className="font-display font-semibold hover:text-pink-deep">
                  {product.name}
                </Link>
                <p className="text-sm font-bold">{formatPrice(unitPriceFor(product, item.customisation))}</p>
                <CustomisationList product={product} values={item.customisation} />
                {!available && <p className="mt-1 text-sm font-bold text-pink-deep">Currently unavailable</p>}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
                  <button
                    type="button"
                    className="text-pink-deep hover:underline disabled:text-ink-soft disabled:no-underline"
                    disabled={!available}
                    onClick={() => {
                      cart.moveToCart(item.lineId);
                      toast({ title: "Moved to cart", description: product.name });
                    }}
                  >
                    Move to cart
                  </button>
                  <button type="button" className="text-ink-soft hover:text-pink-deep" onClick={() => cart.removeSaved(item.lineId)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );

  if (cart.lines.length === 0) {
    return (
      <>
        <EmptyState mood="oops" title={microcopy.emptyCartTitle} text={microcopy.emptyCartText} action={{ label: "Explore Products", href: "/shop" }} />
        {savedSection}
      </>
    );
  }

  const unavailable = totals.lines.filter((l) => !l.available);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="cart-items-title">
          <h2 id="cart-items-title" className="sr-only">
            Items in your cart
          </h2>
          {unavailable.length > 0 && (
            <p className="mb-4 rounded-2xl bg-pink-soft px-4 py-3 text-sm font-semibold text-pink-deep" role="alert">
              Some items are no longer available and won’t be included in your order. Save them for later or remove them.
            </p>
          )}
          <ul className="space-y-4">
            {totals.lines.map((line) => (
              <li key={line.lineId} className="card flex gap-4 p-4 sm:p-5">
                <Link href={`/products/${line.product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-pink-soft/40 sm:h-32 sm:w-32">
                  <ProductImage image={line.product.images[0]} alt={line.product.name} sizes="128px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${line.product.slug}`} className="font-display text-lg font-semibold hover:text-pink-deep">
                        {line.product.name}
                      </Link>
                      <p className="text-sm text-ink-soft">{formatPrice(line.unitPrice)} each</p>
                      <CustomisationList product={line.product} values={line.customisation} />
                      {!line.available && <p className="mt-1 text-sm font-bold text-pink-deep">Sold out — not included</p>}
                    </div>
                    <p className="shrink-0 font-display text-lg font-bold">{formatPrice(line.lineTotal)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      max={Math.max(1, Math.min(line.product.stock, 20))}
                      onChange={(q) => cart.setQuantity(line.lineId, q)}
                      label={`Quantity for ${line.product.name}`}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft hover:text-grape-deep"
                      onClick={() => {
                        cart.saveForLater(line.lineId);
                        toast({ title: "Saved for later", description: line.product.name, tone: "info" });
                      }}
                    >
                      <Bookmark className="h-4 w-4" aria-hidden /> Save for later
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft hover:text-pink-deep"
                      onClick={() => {
                        cart.remove(line.lineId);
                        track("remove_from_cart", { item_id: line.product.id });
                        toast({ title: "Removed from cart", description: line.product.name, tone: "info" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/shop" className="btn btn-ghost mt-4">
            ← Continue shopping
          </Link>
        </section>

        <aside aria-labelledby="summary-title" className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6">
            <h2 id="summary-title" className="font-display text-2xl font-bold">
              Order summary
            </h2>
            <div className="mt-5">
              <CouponForm couponCode={cart.coupon?.code ?? null} error={totals.couponError} />
            </div>
            <div className="mt-6">
              <TotalsList totals={totals} />
            </div>
            <Link
              href="/checkout"
              aria-disabled={totals.itemCount === 0}
              className="btn btn-primary mt-6 w-full text-lg aria-disabled:pointer-events-none aria-disabled:opacity-50"
              onClick={() => track("begin_checkout", { value: totals.total, currency: "INR" })}
            >
              <Lock className="h-5 w-5" aria-hidden /> Checkout <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            {isWhatsAppConfigured(shop.settings.whatsappNumber) && totals.itemCount > 0 && (
              <a
                href={whatsappLink(shop.settings.whatsappNumber, buildOrderMessage(totals))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp mt-3 w-full"
                onClick={() => track("whatsapp_order", { value: totals.total, source: "cart" })}
              >
                <WhatsAppIcon /> Quick order via WhatsApp
              </a>
            )}
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-soft">
              <ShoppingBag className="h-4 w-4" aria-hidden /> Your cart is saved on this device
            </p>
          </div>
        </aside>
      </div>
      {savedSection}
    </>
  );
}
