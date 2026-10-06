import type { Metadata } from "next";
import { Download } from "lucide-react";
import { DeleteSubscriber, MarkGroupNotified } from "@/components/admin/SubscriberActions";
import { EmptyNote, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { listNotifyRequests, listProducts } from "@/server/admin-data";

export const metadata: Metadata = { title: "Notify-me list" };

const TOPIC_LABEL: Record<string, string> = {
  newsletter: "New drops newsletter",
  "creator-collaborations": "Creator collaborations",
};

export default async function SubscribersPage() {
  const [rows, products] = await Promise.all([listNotifyRequests(), listProducts()]);
  const names = new Map(products.map((p) => [p.id, p.name]));
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.productId ? `Product: ${names.get(r.productId) ?? "deleted product"}` : TOPIC_LABEL[r.topic] ?? r.topic;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return (
    <>
      <PageHeader
        title="Notify-me list"
        description="People who asked to hear when a product is back or launched. Email them, then mark them as notified."
        actions={
          rows.length ? (
            <a href="/api/admin/export/subscribers" className="btn btn-secondary btn-sm">
              <Download className="h-4 w-4" aria-hidden /> Download CSV
            </a>
          ) : null
        }
      />
      {rows.length ? (
        <div className="space-y-4">
          {[...groups.entries()].map(([title, list]) => {
            const waiting = list.filter((r) => !r.notifiedAt);
            return (
              <Panel
                key={title}
                title={title}
                description={`${waiting.length} waiting · ${list.length - waiting.length} notified`}
                actions={waiting.length ? <MarkGroupNotified ids={waiting.map((r) => r.id)} /> : null}
              >
                {waiting.length > 0 && (
                  <p className="mb-3 text-sm">
                    <a
                      className="font-bold text-pink-deep hover:underline"
                      href={`mailto:?bcc=${encodeURIComponent(waiting.map((r) => r.email).join(","))}&subject=${encodeURIComponent("Good news from Hi Five by Jia ✋")}`}
                    >
                      Email everyone waiting (BCC) →
                    </a>
                  </p>
                )}
                <ul className="divide-y divide-line">
                  {list.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1 truncate font-semibold">{r.email}</span>
                      <span className="hidden text-xs text-ink-soft sm:inline">{formatDateTime(r.createdAt)}</span>
                      {r.notifiedAt ? <Pill tone="green">Notified</Pill> : <Pill tone="yellow">Waiting</Pill>}
                      <DeleteSubscriber id={r.id} />
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyNote>No sign-ups yet. They appear when customers tap “Notify me”.</EmptyNote>
      )}
    </>
  );
}
