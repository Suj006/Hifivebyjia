"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { cn } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/order-status";
import { deleteOrder, updateOrder } from "@/server/actions/inbox";
import type { OrderStatus } from "@/types";

export function OrderEditor({ id, status, note, stockAdjusted }: { id: string; status: OrderStatus; note: string; stockAdjusted: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [text, setText] = useState(note);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const res = await updateOrder(id, value, text);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "Saved." : res.error ?? "Couldn’t save." });
      router.refresh();
    });

  const remove = () =>
    start(async () => {
      if (!confirm("Delete this order permanently?")) return;
      const res = await deleteOrder(id);
      if (res.ok) router.push("/admin/orders");
      else setMsg({ ok: false, text: res.error ?? "Couldn’t delete." });
    });

  return (
    <Panel title="Status" description={stockAdjusted ? "Stock has been reduced for this order." : "Stock is reduced when you mark it Confirmed."}>
      <div className="space-y-2" role="radiogroup" aria-label="Order status">
        {ORDER_STATUSES.map((s) => (
          <label key={s.value} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3", value === s.value ? "border-pink-deep bg-pink-soft/40" : "border-line")}>
            <input type="radio" name="order-status" className="mt-1 h-4 w-4 accent-pink-deep" checked={value === s.value} onChange={() => setValue(s.value)} />
            <span>
              <span className="block font-bold">{s.label}</span>
              <span className="block text-xs text-ink-soft">{s.help}</span>
            </span>
          </label>
        ))}
      </div>
      <label htmlFor="order-note" className="mt-4 mb-1.5 block text-sm font-bold">
        Private note
      </label>
      <textarea id="order-note" value={text} onChange={(e) => setText(e.target.value)} className="input min-h-24" placeholder="e.g. Paid by UPI on 6 Oct, tracking number…" />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary btn-sm">
          <Save className="h-4 w-4" aria-hidden /> {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost btn-sm text-pink-deep">
          <Trash2 className="h-4 w-4" aria-hidden /> Delete order
        </button>
      </div>
      {msg && (
        <p role="status" className={cn("mt-2 text-sm font-bold", msg.ok ? "text-mint-deep" : "text-pink-deep")}>
          {msg.text}
        </p>
      )}
    </Panel>
  );
}
