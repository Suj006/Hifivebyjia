import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";
import { OrderEditor } from "@/components/admin/OrderEditor";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusInfo } from "@/lib/order-status";
import { getOrder, getProduct } from "@/server/admin-data";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const s = orderStatusInfo(order.status);
  const c = order.customer;
  const mobile = c.mobile.replace(/\D/g, "").slice(-10);
  const labels = new Map<string, Record<string, string>>();
  for (const l of order.lines) {
    const p = await getProduct(l.productId);
    if (p) labels.set(l.productId, Object.fromEntries((p.customisation ?? []).map((f) => [f.id, f.label])));
  }
  const t = order.totals;

  return (
    <>
      <PageHeader title={`Order ${order.reference}`} back={{ href: "/admin/orders", label: "Orders" }} description={`Received ${formatDateTime(order.createdAt)}`} actions={<Pill tone={s.tone}>{s.label}</Pill>} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {order.lines.map((l, i) => (
                <li key={i} className="flex gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${l.productId}`} className="font-bold hover:text-pink-deep">
                      {l.name}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {l.quantity} × {formatPrice(l.unitPrice)} {l.sku ? `· ${l.sku}` : ""}
                    </p>
                    {l.customisation && (
                      <dl className="mt-1 rounded-xl bg-grape-soft/60 px-3 py-2 text-sm">
                        {Object.entries(l.customisation).map(([k, v]) => (
                          <div key={k} className="flex gap-1">
                            <dt className="font-bold">{labels.get(l.productId)?.[k] ?? k}:</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                  <p className="font-bold">{formatPrice(l.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-dashed border-line pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(t.subtotal)}</dd></div>
              {t.discounts.map((d) => (
                <div key={d.discountId} className="flex justify-between text-mint-deep"><dt>Discount {d.code ? `(${d.code})` : `· ${d.label}`}</dt><dd>−{formatPrice(d.amount)}</dd></div>
              ))}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{t.shipping ? formatPrice(t.shipping) : "Free"}</dd></div>
              <div className="flex justify-between font-display text-lg font-bold"><dt>Total</dt><dd>{formatPrice(t.total)}</dd></div>
            </dl>
            {t.couponError && <p className="mt-2 rounded-xl bg-sunny-soft px-3 py-2 text-sm">Coupon note: {t.couponError}</p>}
            {order.clientTotal !== null && order.clientTotal !== t.total && (
              <p className="mt-2 rounded-xl bg-sunny-soft px-3 py-2 text-sm">
                The customer’s WhatsApp message showed {formatPrice(order.clientTotal)}. The correct total (calculated by the server) is {formatPrice(t.total)}.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-display text-lg font-bold">{c.name}</p>
            <p className="mt-1 text-sm whitespace-pre-line text-ink-soft">
              {c.address}
              {"\n"}
              {c.city}, {c.state} – {c.pincode}
            </p>
            {c.notes && <p className="mt-2 rounded-xl bg-sky-soft px-3 py-2 text-sm">Note: {c.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/91${mobile}?text=${encodeURIComponent(`Hello ${c.name.split(" ")[0]}! Thank you for your Hi Five by Jia order ${order.reference}. `)}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`tel:${c.mobile}`} className="btn btn-secondary btn-sm">
                <Phone className="h-4 w-4" aria-hidden /> {c.mobile}
              </a>
              <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your Hi Five by Jia order ${order.reference}`)}`} className="btn btn-secondary btn-sm">
                <Mail className="h-4 w-4" aria-hidden /> Email
              </a>
            </div>
          </Panel>
          <OrderEditor id={order.id} status={order.status} note={order.note} stockAdjusted={order.stockAdjusted} />
        </div>
      </div>
    </>
  );
}
