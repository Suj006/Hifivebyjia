"use client";

import Link from "next/link";
import { FloatingHearts } from "@/components/brand/Heart";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Nainu } from "@/components/brand/Nainu";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { EmptyState } from "@/components/common/EmptyState";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { buildOrderRequestMessage, isWhatsAppConfigured, mailtoLink, whatsappLink } from "@/lib/whatsapp";
import { useHydrated, useOrderHistory } from "@/store/records";

export function OrderConfirmation() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const orders = useOrderHistory();
  const ref = params.get("ref");
  const order = orders.find((o) => o.reference === ref) ?? (ref ? undefined : orders[0]);

  if (!hydrated) return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-[2rem] bg-white" aria-busy="true" />;

  if (!order) {
    return <EmptyState mood="thinking" title="We couldn’t find that order" text="Order requests are saved on the device they were placed from." action={{ label: "Back to shop", href: "/shop" }} />;
  }

  const message = buildOrderRequestMessage(order);
  const whatsapp = isWhatsAppConfigured();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card overflow-hidden text-center">
        <div className="relative bg-linear-to-br from-mint-soft via-sunny-soft to-pink-soft px-6 pt-10 pb-6">
          <FloatingHearts />
          <div className="mx-auto w-36 animate-bounce-in">
            <Nainu mood="celebrate" label="Nainu celebrating your order" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Thank you, {order.customer.name.split(" ")[0]}! ✋</h1>
          <p className="mt-2 text-ink-soft">Your order request has been created.</p>
          <p className="mt-4 inline-block rounded-full bg-white px-5 py-2 font-display font-bold shadow-soft">
            Reference: <span className="text-pink-deep">{order.reference}</span>
          </p>
        </div>
        <div className="p-6 text-left sm:p-8">
          <h2 className="font-display text-xl font-bold">What happens next?</h2>
          <ol className="mt-4 space-y-3">
            {[
              whatsapp ? "Send the pre-filled message on WhatsApp (if it didn’t open, tap the button below)." : "Send the pre-filled email (if it didn’t open, tap the button below).",
              "We’ll confirm availability, the final total and payment details.",
              "Your handmade goodies get packed with care and shipped to you!",
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-deep text-sm font-bold text-white">{i + 1}</span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>

          <a
            href={whatsapp ? whatsappLink(message) : mailtoLink(`New order request ${order.reference}`, message)}
            target={whatsapp ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={whatsapp ? "btn btn-whatsapp mt-6 w-full text-lg" : "btn btn-primary mt-6 w-full text-lg"}
          >
            {whatsapp ? <WhatsAppIcon /> : <Mail className="h-5 w-5" aria-hidden />}
            {whatsapp ? "Send order on WhatsApp" : "Send order by email"}
          </a>

          <h2 className="mt-8 font-display text-xl font-bold">Order summary</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-4 py-2">
                <span>
                  {l.name} × {l.quantity}
                  {l.customisation && <span className="block text-ink-soft">{Object.values(l.customisation).join(" · ")}</span>}
                </span>
                <span className="font-bold">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-dashed border-line pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {order.discountTotal > 0 && <div className="flex justify-between text-mint-deep"><dt>Discount</dt><dd>−{formatPrice(order.discountTotal)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping (estimate)</dt><dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd></div>
            <div className="flex justify-between font-display text-lg font-bold"><dt>Estimated total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
          <p className="mt-6 text-center text-sm text-ink-soft">
            Need help? Email <a href={`mailto:${siteConfig.contact.email}`} className="font-bold text-pink-deep">{siteConfig.contact.email}</a>
          </p>
          <Link href="/shop" className="btn btn-secondary mt-4 w-full">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
