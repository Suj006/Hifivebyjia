"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { FieldLabel, Panel, Toggle } from "@/components/admin/ui";
import { cn } from "@/lib/format";
import { saveStoreSettings } from "@/server/actions/settings";
import type { StoreSettings } from "@/types";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setMsg(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveStoreSettings(s);
    setSaving(false);
    setMsg({ ok: res.ok, text: res.ok ? "Saved! The website is updated." : res.error ?? "Couldn’t save." });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel title="WhatsApp orders" description="Orders and questions open WhatsApp with this number. Use a business number — never a child’s personal number.">
        <FieldLabel htmlFor="s-wa" hint="Country code + number, digits only. Example: 919876543210">
          WhatsApp number
        </FieldLabel>
        <input id="s-wa" value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" className="input max-w-sm py-2.5" placeholder="91XXXXXXXXXX" />
        {!s.whatsappNumber && <p className="mt-1 text-xs text-ink-soft">Empty: checkout sends orders by email instead.</p>}
      </Panel>

      <Panel title="Shipping" description="Used for the shipping estimate in the cart, the FAQ and the Shipping page.">
        <Toggle id="s-ship" label="Charge shipping" hint="Turn off to make shipping free on every order." checked={s.shippingEnabled} onChange={(v) => set("shippingEnabled", v)} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="s-rate">Standard shipping (₹)</FieldLabel>
            <input id="s-rate" type="number" min={0} value={s.standardShippingRate} onChange={(e) => set("standardShippingRate", Number(e.target.value))} className="input py-2.5" />
          </div>
          <div>
            <FieldLabel htmlFor="s-free" hint="0 = no free shipping.">
              Free shipping on orders from (₹)
            </FieldLabel>
            <input id="s-free" type="number" min={0} value={s.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} className="input py-2.5" />
          </div>
          <div>
            <FieldLabel htmlFor="s-dispatch">Dispatch time</FieldLabel>
            <input id="s-dispatch" value={s.dispatchTime} onChange={(e) => set("dispatchTime", e.target.value)} className="input py-2.5" maxLength={60} />
          </div>
          <div>
            <FieldLabel htmlFor="s-delivery">Delivery time</FieldLabel>
            <input id="s-delivery" value={s.deliveryTime} onChange={(e) => set("deliveryTime", e.target.value)} className="input py-2.5" maxLength={80} />
          </div>
        </div>
      </Panel>

      <Panel title="Admin password">
        <p className="text-sm text-ink-soft">
          The password is stored safely as <code>ADMIN_PASSWORD</code> in Vercel → Settings → Environment Variables. To change it, update it there and redeploy — everyone is signed out automatically.
        </p>
      </Panel>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-5 w-5" aria-hidden /> {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && (
          <p role="status" className={cn("text-sm font-bold", msg.ok ? "text-mint-deep" : "text-pink-deep")}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}
