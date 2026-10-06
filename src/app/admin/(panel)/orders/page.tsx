import type { Metadata } from "next";
import Link from "next/link";
import { EmptyNote, PageHeader, Pill } from "@/components/admin/ui";
import { cn, formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, orderStatusInfo } from "@/lib/order-status";
import { listOrders } from "@/server/admin-data";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const orders = await listOrders(status || undefined);
  const tabs = [{ value: "", label: "All" }, ...ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label }))];
  return (
    <>
      <PageHeader title="Orders" description="Order requests from checkout. Totals are calculated by the server." />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filter by status">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `/admin/orders?status=${t.value}` : "/admin/orders"}
            aria-current={status === t.value ? "page" : undefined}
            className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold", status === t.value ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-line bg-white hover:border-pink")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {orders.length ? (
        <ul className="space-y-2">
          {orders.map((o) => {
            const s = orderStatusInfo(o.status);
            const items = o.lines.reduce((n, l) => n + l.quantity, 0);
            return (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-sm hover:border-pink sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold">
                      {o.customer.name} <span className="text-sm font-normal text-ink-soft">· {o.reference}</span>
                    </p>
                    <p className="text-sm text-ink-soft">
                      {formatDateTime(o.createdAt)} · {items} item{items === 1 ? "" : "s"} · {o.customer.city}
                    </p>
                  </div>
                  {o.couponCode && <Pill tone="green">{o.couponCode}</Pill>}
                  <Pill tone={s.tone}>{s.label}</Pill>
                  <span className="w-20 text-right font-display text-lg font-bold">{formatPrice(o.totals.total)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote>{status ? "No orders with this status." : "No orders yet. They’ll appear here when customers check out."}</EmptyNote>
      )}
    </>
  );
}
