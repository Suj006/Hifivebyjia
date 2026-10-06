import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { EmptyNote, PageHeader, Panel, Pill, StatCard } from "@/components/admin/ui";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusInfo } from "@/lib/order-status";
import { getDashboard } from "@/server/admin-data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const d = await getDashboard();
  return (
    <>
      <PageHeader
        title="Hello! ✋"
        description="Here’s what’s happening in the shop."
        actions={
          <>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" aria-hidden /> Add product
            </Link>
            <Link href="/admin/coupons/new" className="btn btn-secondary btn-sm">
              <Plus className="h-4 w-4" aria-hidden /> New coupon
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="New order requests" value={d.newOrders} href="/admin/orders?status=requested" tone="yellow" />
        <StatCard label="Orders (last 30 days)" value={d.orders30d} href="/admin/orders" tone="blue" />
        <StatCard label="Confirmed sales (30 days)" value={formatPrice(d.revenue30d)} tone="green" />
        <StatCard label="Products on sale" value={d.activeProducts} href="/admin/products" tone="pink" />
        <StatCard label="Reviews to check" value={d.pendingReviews} href="/admin/reviews" tone="purple" />
        <StatCard label="Unread messages" value={d.unreadMessages} href="/admin/messages" tone="pink" />
        <StatCard label="Waiting for Notify-me" value={d.subscribers} href="/admin/subscribers" tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Latest orders" actions={<Link href="/admin/orders" className="text-sm font-bold text-pink-deep hover:underline">All orders →</Link>}>
          {d.recentOrders.length ? (
            <ul className="divide-y divide-line">
              {d.recentOrders.map((o) => {
                const s = orderStatusInfo(o.status);
                return (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-[#FBF8FC]">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">
                          {o.customer.name} <span className="font-normal text-ink-soft">· {o.reference}</span>
                        </p>
                        <p className="text-sm text-ink-soft">{formatDateTime(o.createdAt)}</p>
                      </div>
                      <Pill tone={s.tone}>{s.label}</Pill>
                      <span className="w-16 text-right font-bold">{formatPrice(o.totals.total)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyNote>No orders yet. They’ll appear here when customers check out.</EmptyNote>
          )}
        </Panel>

        <Panel title="Low stock" description="Active products with 3 or fewer left.">
          {d.lowStock.length ? (
            <ul className="space-y-2">
              {d.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-2 rounded-2xl bg-sunny-soft/60 px-3 py-2 hover:bg-sunny-soft">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-sunny-deep" aria-hidden />
                    <span className="flex-1 font-semibold">{p.name}</span>
                    <span className="text-sm font-bold">{p.stock} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>All good — nothing is running low.</EmptyNote>
          )}
        </Panel>
      </div>
    </>
  );
}
