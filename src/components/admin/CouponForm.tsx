"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { FieldLabel, Panel, Toggle } from "@/components/admin/ui";
import { cn, formatPrice } from "@/lib/format";
import { istInputToIso, isoToIstInput } from "@/lib/ist";
import { describeDiscount } from "@/lib/pricing";
import { deleteDiscount, resetDiscountUsage, saveDiscount, type DiscountInput } from "@/server/actions/discounts";
import type { Category, Collection, Discount, DiscountScope } from "@/types";

type CouponType = "percentage" | "fixed" | "bxgy";
type ScopeType = DiscountScope["type"];

interface Draft {
  automatic: boolean;
  code: string;
  label: string;
  description: string;
  type: CouponType;
  value: string;
  maximumDiscount: string;
  minimumOrder: string;
  buy: string;
  get: string;
  getPercent: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  firstOrderOnly: boolean;
  promote: boolean;
  active: boolean;
  scopeType: ScopeType;
  scopeItems: string[];
}

function toDraft(d?: Discount): Draft {
  const scope = d?.scope ?? { type: "order" };
  return {
    automatic: Boolean(d?.automatic),
    code: d?.code ?? "",
    label: d?.label ?? "",
    description: d?.description ?? "",
    type: d?.kind === "buy_x_get_y" ? "bxgy" : d?.valueType === "fixed" ? "fixed" : "percentage",
    value: d && d.kind !== "buy_x_get_y" ? String(d.value) : "",
    maximumDiscount: d?.maximumDiscount ? String(d.maximumDiscount) : "",
    minimumOrder: d?.minimumOrder ? String(d.minimumOrder) : "",
    buy: String(d?.buyXGetY?.buyQuantity ?? 2),
    get: String(d?.buyXGetY?.getQuantity ?? 1),
    getPercent: String(d?.buyXGetY?.getDiscountPercent ?? 100),
    startsAt: isoToIstInput(d?.startsAt),
    endsAt: isoToIstInput(d?.endsAt),
    usageLimit: d?.usageLimit ? String(d.usageLimit) : "",
    firstOrderOnly: Boolean(d?.firstOrderOnly),
    promote: Boolean(d?.promote),
    active: d?.active ?? true,
    scopeType: scope.type,
    scopeItems: scope.type === "categories" ? scope.categories : scope.type === "collections" ? scope.collections : scope.type === "products" ? scope.productIds : [],
  };
}

function toInput(d: Draft): DiscountInput {
  const scope: DiscountScope =
    d.scopeType === "categories"
      ? { type: "categories", categories: d.scopeItems }
      : d.scopeType === "collections"
        ? { type: "collections", collections: d.scopeItems }
        : d.scopeType === "products"
          ? { type: "products", productIds: d.scopeItems }
          : { type: "order" };
  const n = (s: string) => (s.trim() === "" ? undefined : Number(s));
  return {
    code: d.automatic ? undefined : d.code,
    label: d.label,
    description: d.description,
    kind: d.type === "bxgy" ? "buy_x_get_y" : "standard",
    valueType: d.type === "fixed" ? "fixed" : "percentage",
    value: d.type === "bxgy" ? 0 : Number(d.value),
    buyXGetY: d.type === "bxgy" ? { buyQuantity: Number(d.buy), getQuantity: Number(d.get), getDiscountPercent: Number(d.getPercent) } : undefined,
    maximumDiscount: n(d.maximumDiscount),
    minimumOrder: n(d.minimumOrder),
    usageLimit: n(d.usageLimit),
    startsAt: istInputToIso(d.startsAt),
    endsAt: istInputToIso(d.endsAt),
    firstOrderOnly: d.firstOrderOnly,
    automatic: d.automatic,
    promote: d.promote,
    active: d.active,
    scope,
  };
}

interface Props {
  discount?: Discount;
  categories: Category[];
  collections: Collection[];
  products: { id: string; name: string }[];
}

export function CouponForm({ discount, categories, collections, products }: Props) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => toDraft(discount));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((prev) => ({ ...prev, [k]: v, ...(k === "scopeType" ? { scopeItems: [] } : {}) }));
    setMessage(null);
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveDiscount(toInput(d), discount?.id);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setMessage({ tone: "error", text: res.error ?? "Couldn’t save." });
      return;
    }
    setErrors({});
    if (!discount) {
      router.push("/admin/coupons");
      router.refresh();
      return;
    }
    setMessage({ tone: "ok", text: "Saved! The offer is updated on the website." });
    router.refresh();
  }

  async function onDelete() {
    if (!discount || !confirm("Delete this coupon permanently?")) return;
    await deleteDiscount(discount.id); // redirects to the coupon list
  }

  async function onReset() {
    if (!discount || !confirm("Reset the usage count to 0?")) return;
    await resetDiscountUsage(discount.id);
    router.refresh();
  }

  const err = (k: string) => errors[k] && <p className="field-error" role="alert">{errors[k]}</p>;
  const input = (k: keyof Draft, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`cf-${k}`} value={String(d[k])} onChange={(e) => set(k, e.target.value as never)} className="input py-2.5" aria-invalid={Boolean(errors[k])} {...props} />
  );

  const preview = toInput(d);
  const summary =
    d.type === "bxgy" || Number(d.value) > 0
      ? describeDiscount({ id: "preview", ...preview, value: preview.value || 0 } as Discount)
      : "Fill in the discount to see a summary.";

  const scopeOptions: { value: string; label: string }[] =
    d.scopeType === "categories"
      ? categories.map((c) => ({ value: c.slug, label: c.name }))
      : d.scopeType === "collections"
        ? collections.map((c) => ({ value: c.slug, label: `${c.emoji} ${c.name}` }))
        : d.scopeType === "products"
          ? products.map((p) => ({ value: p.id, label: p.name }))
          : [];

  return (
    <form onSubmit={onSave} noValidate className="space-y-6 pb-28">
      <Panel title="How customers get it">
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="How customers get it">
          <Choice active={!d.automatic} onClick={() => set("automatic", false)} title="Coupon code" text="Customers type a code in the cart (e.g. DIWALI15)." />
          <Choice active={d.automatic} onClick={() => set("automatic", true)} title="Automatic offer" text="Applies by itself to everyone — great for sales." />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {!d.automatic && (
            <div>
              <FieldLabel htmlFor="cf-code" hint="Letters, numbers and dashes. Customers can type it in any case.">
                Coupon code
              </FieldLabel>
              <input
                id="cf-code"
                value={d.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                className="input py-2.5 font-display text-lg tracking-widest uppercase"
                maxLength={20}
                placeholder="DIWALI15"
                aria-invalid={Boolean(errors.code)}
              />
              {err("code")}
            </div>
          )}
          <div>
            <FieldLabel htmlFor="cf-label" hint="Shown in the cart, e.g. “Diwali 15% off”.">
              Offer name
            </FieldLabel>
            {input("label", { maxLength: 60 })}
            {err("label")}
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="cf-description" optional hint="Short explanation, shown with the cart hint.">
              Description
            </FieldLabel>
            {input("description", { maxLength: 160 })}
          </div>
        </div>
      </Panel>

      <Panel title="Discount">
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Discount type">
          <Choice active={d.type === "percentage"} onClick={() => set("type", "percentage")} title="Percentage (%)" text="e.g. 10% off" />
          <Choice active={d.type === "fixed"} onClick={() => set("type", "fixed")} title="Fixed amount (₹)" text="e.g. ₹50 off" />
          <Choice active={d.type === "bxgy"} onClick={() => set("type", "bxgy")} title="Buy X, get Y" text="e.g. buy 2, get 1 free" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {d.type !== "bxgy" ? (
            <div>
              <FieldLabel htmlFor="cf-value">{d.type === "percentage" ? "Percentage off (%)" : "Amount off (₹)"}</FieldLabel>
              {input("value", { type: "number", min: 1, max: d.type === "percentage" ? 100 : undefined, inputMode: "decimal" })}
              {err("value")}
              {d.type === "fixed" && d.scopeType !== "order" && <p className="mt-1 text-xs text-ink-soft">Taken off each matching item.</p>}
            </div>
          ) : (
            <>
              <div>
                <FieldLabel htmlFor="cf-buy">Customer buys</FieldLabel>
                {input("buy", { type: "number", min: 1 })}
                {err("buy")}
              </div>
              <div>
                <FieldLabel htmlFor="cf-get">…and gets</FieldLabel>
                {input("get", { type: "number", min: 1 })}
                {err("get")}
              </div>
              <div>
                <FieldLabel htmlFor="cf-getPercent" hint="100 = free (the cheapest items).">
                  % off those items
                </FieldLabel>
                {input("getPercent", { type: "number", min: 1, max: 100 })}
                {err("getPercent")}
              </div>
            </>
          )}
          <div>
            <FieldLabel htmlFor="cf-maximumDiscount" optional hint="The discount will never be more than this.">
              Maximum discount (₹)
            </FieldLabel>
            {input("maximumDiscount", { type: "number", min: 1, inputMode: "numeric", placeholder: "No limit" })}
            {err("maximumDiscount")}
          </div>
          <div>
            <FieldLabel htmlFor="cf-minimumOrder" optional hint="Cart total needed to use it.">
              Minimum order (₹)
            </FieldLabel>
            {input("minimumOrder", { type: "number", min: 0, inputMode: "numeric", placeholder: "None" })}
            {err("minimumOrder")}
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-mint-soft px-4 py-3 text-sm font-bold text-mint-deep" aria-live="polite">
          Summary: {summary}
          {d.maximumDiscount && d.type !== "percentage" ? ` · max ${formatPrice(Number(d.maximumDiscount))}` : ""}
        </p>
      </Panel>

      <Panel title="When it works" description="Dates and times are in India time (IST). Leave empty to start now / never end.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="cf-startsAt" optional>
              Starts
            </FieldLabel>
            {input("startsAt", { type: "datetime-local" })}
          </div>
          <div>
            <FieldLabel htmlFor="cf-endsAt" optional>
              Ends
            </FieldLabel>
            {input("endsAt", { type: "datetime-local" })}
            {err("endsAt")}
          </div>
          <div>
            <FieldLabel htmlFor="cf-usageLimit" optional hint={discount ? `Used ${discount.usageCount ?? 0} times so far.` : "Total number of orders."}>
              Usage limit
            </FieldLabel>
            {input("usageLimit", { type: "number", min: 1, placeholder: "Unlimited" })}
            {err("usageLimit")}
            {discount && (discount.usageCount ?? 0) > 0 && (
              <button type="button" onClick={onReset} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-pink-deep">
                <RotateCcw className="h-3 w-3" aria-hidden /> Reset count
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="What it applies to">
        <div className="grid gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Applies to">
          {(
            [
              ["order", "Whole order"],
              ["categories", "Categories"],
              ["collections", "Collections"],
              ["products", "Specific products"],
            ] as [ScopeType, string][]
          ).map(([value, label]) => (
            <Choice key={value} active={d.scopeType === value} onClick={() => set("scopeType", value)} title={label} />
          ))}
        </div>
        {scopeOptions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" id="cf-scope">
            {scopeOptions.map((o) => {
              const on = d.scopeItems.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("scopeItems", on ? d.scopeItems.filter((x) => x !== o.value) : [...d.scopeItems, o.value])}
                  className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold", on ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-line bg-white hover:border-pink")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
        {err("scope")}
      </Panel>

      <Panel title="Extra rules">
        <div className="grid gap-2 sm:grid-cols-3">
          <Toggle id="cf-active" label="Switched on" hint="Turn off to pause it anytime." checked={d.active} onChange={(v) => set("active", v)} />
          {!d.automatic && (
            <>
              <Toggle id="cf-first" label="First order only" hint="For customers ordering for the first time." checked={d.firstOrderOnly} onChange={(v) => set("firstOrderOnly", v)} />
              <Toggle id="cf-promote" label="Show as a hint in the cart" hint="“Psst… try CODE”" checked={d.promote} onChange={(v) => set("promote", v)} />
            </>
          )}
        </div>
      </Panel>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-10">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save className="h-5 w-5" aria-hidden /> {saving ? "Saving…" : discount ? "Save changes" : "Create coupon"}
          </button>
          {discount && (
            <button type="button" onClick={onDelete} className="btn btn-ghost btn-sm text-pink-deep">
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </button>
          )}
          {message && (
            <p role="status" className={cn("ml-auto text-sm font-bold", message.tone === "ok" ? "text-mint-deep" : "text-pink-deep")}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function Choice({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn("rounded-2xl border-2 p-3 text-left transition", active ? "border-pink-deep bg-pink-soft/40" : "border-line bg-white hover:border-pink")}
    >
      <span className="block font-bold">{title}</span>
      {text && <span className="block text-xs text-ink-soft">{text}</span>}
    </button>
  );
}
