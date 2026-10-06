"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Copy, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FieldLabel, Panel, Toggle } from "@/components/admin/ui";
import { PRODUCT_STATUS_INFO } from "@/lib/admin-labels";
import { AUDIENCE_LABELS } from "@/lib/catalog";
import { cn, discountPercent } from "@/lib/format";
import { deleteProduct, duplicateProduct, saveProduct, type ProductInput } from "@/server/actions/products";
import type { Audience, Category, Collection, CustomisationField, Product, ProductStatus } from "@/types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

const PRESETS: { label: string; field: Omit<CustomisationField, "id"> }[] = [
  { label: "Size (Kids / Teens / Adults)", field: { label: "Size", type: "select", required: true, options: ["Kids (approx. 15 cm)", "Teens (approx. 16.5 cm)", "Adults (approx. 18 cm)"] } },
  { label: "Name / letters", field: { label: "Name / letters", type: "text", required: true, maxLength: 10, placeholder: "e.g. JIA", helpText: "Up to 10 letters or numbers.", pattern: "^[A-Za-z0-9 ♥]+$" } },
  { label: "Colour", field: { label: "Colour", type: "select", required: true, options: ["Rainbow", "Pinks", "Blues", "Pastels"] } },
  { label: "Special instructions", field: { label: "Special instructions", type: "textarea", required: false, maxLength: 200, placeholder: "Anything we should know? (optional)" } },
];

const AUDIENCES: Audience[] = ["kids", "teens", "adults", "women", "families", "everyone"];

type FieldDraft = CustomisationField & { optionsText?: string; key: string };

interface Draft {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  status: ProductStatus;
  category: string;
  collections: string[];
  audience: Audience[];
  tags: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  isSample: boolean;
  sortOrder: string;
  images: Product["images"];
  personalise: boolean;
  fields: FieldDraft[];
  launchLabel: string;
  launchDate: string;
  materials: string;
  care: string;
  weight: string;
  circumference: string;
  length: string;
  hsn: string;
  gstRate: string;
}

let keyCounter = 0;
const nextKey = () => `f${++keyCounter}`;

function toDraft(p?: Product, categories?: Category[]): Draft {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    shortDescription: p?.shortDescription ?? "",
    description: p?.description ?? "",
    price: p ? String(p.price) : "",
    compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : "",
    stock: p ? String(p.stock) : "10",
    sku: p?.sku ?? "",
    status: p?.status ?? "active",
    category: p?.category ?? categories?.[0]?.slug ?? "",
    collections: p?.collections ?? [],
    audience: p?.audience ?? ["kids", "teens"],
    tags: (p?.tags ?? ["handmade"]).join(", "),
    featured: p?.featured ?? false,
    bestseller: p?.bestseller ?? false,
    newArrival: p?.newArrival ?? true,
    isSample: p?.isSample ?? false,
    sortOrder: String(p?.sortOrder ?? 10),
    images: p?.images?.filter((i) => !i.src.endsWith("/placeholder.svg")) ?? [],
    personalise: Boolean(p?.customisation?.length),
    fields: (p?.customisation ?? []).map((f) => ({ ...f, key: nextKey(), optionsText: (f.options ?? []).join("\n") })),
    launchLabel: p?.launchLabel ?? "",
    launchDate: p?.launchDate?.slice(0, 10) ?? "",
    materials: (p?.materials ?? []).join(", "),
    care: p?.care ?? "",
    weight: p?.weight ? String(p.weight) : "",
    circumference: p?.dimensions?.circumferenceCm ? String(p.dimensions.circumferenceCm) : "",
    length: p?.dimensions?.lengthCm ? String(p.dimensions.lengthCm) : "",
    hsn: p?.hsn ?? "",
    gstRate: p?.gstRate == null ? "" : String(p.gstRate),
  };
}

const splitList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

function toInput(d: Draft): ProductInput {
  return {
    name: d.name,
    slug: d.slug,
    shortDescription: d.shortDescription,
    description: d.description,
    price: Number(d.price),
    compareAtPrice: d.compareAtPrice ? Number(d.compareAtPrice) : undefined,
    stock: Number(d.stock),
    sku: d.sku,
    status: d.status,
    category: d.category,
    collections: d.collections,
    audience: d.audience,
    tags: splitList(d.tags),
    featured: d.featured,
    bestseller: d.bestseller,
    newArrival: d.newArrival,
    isSample: d.isSample,
    sortOrder: Number(d.sortOrder) || 0,
    images: d.images,
    customisable: d.personalise && d.fields.length > 0,
    customisation: d.personalise
      ? d.fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.type === "select" ? splitList(f.optionsText ?? "") : undefined,
          maxLength: f.maxLength,
          placeholder: f.placeholder,
          helpText: f.helpText,
          pattern: f.pattern,
          priceAdjustment: f.priceAdjustment,
        }))
      : [],
    launchLabel: d.launchLabel,
    launchDate: d.launchDate,
    materials: splitList(d.materials),
    care: d.care,
    weight: d.weight ? Number(d.weight) : undefined,
    dimensions: { circumferenceCm: d.circumference ? Number(d.circumference) : undefined, lengthCm: d.length ? Number(d.length) : undefined },
    hsn: d.hsn,
    gstRate: d.gstRate === "" ? null : Number(d.gstRate),
  };
}

interface Props {
  product?: Product;
  categories: Category[];
  collections: Collection[];
}

export function ProductForm({ product, categories, collections }: Props) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => toDraft(product, categories));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setD((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    setMessage(null);
  };
  const toggleIn = <T extends string>(key: "collections" | "audience", value: T) =>
    set(key, (d[key] as T[]).includes(value) ? (d[key] as T[]).filter((x) => x !== value) : ([...d[key], value] as never));
  const setField = (i: number, patch: Partial<FieldDraft>) => set("fields", d.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  async function onSave(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await saveProduct(toInput(d), product?.id);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setMessage({ tone: "error", text: res.error ?? "Couldn’t save." });
      const first = Object.keys(res.fieldErrors ?? {})[0];
      if (first) document.getElementById(`pf-${first.split(".")[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    if (!product) {
      router.push(`/admin/products/${res.id}?created=1`);
      return;
    }
    setMessage({ tone: "ok", text: "Saved! The website is updated." });
    router.refresh();
  }

  async function onDelete() {
    if (!product || !confirm(`Delete “${product.name}” permanently? This can’t be undone. (Tip: set the status to “Hidden” instead to keep it.)`)) return;
    const res = await deleteProduct(product.id);
    if (res.ok) router.push("/admin/products");
    else setMessage({ tone: "error", text: res.error ?? "Couldn’t delete." });
  }

  async function onDuplicate() {
    if (!product) return;
    const res = await duplicateProduct(product.id);
    if (res.ok) router.push(`/admin/products/${res.id}`);
    else setMessage({ tone: "error", text: res.error ?? "Couldn’t duplicate." });
  }

  const pct = discountPercent(Number(d.price), Number(d.compareAtPrice) || undefined);
  const err = (k: string) => errors[k] && <p className="field-error" role="alert">{errors[k]}</p>;
  const text = (key: keyof Draft, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`pf-${key}`} value={String(d[key])} onChange={(e) => set(key, e.target.value as never)} className="input py-2.5" aria-invalid={Boolean(errors[key])} {...props} />
  );

  return (
    <form onSubmit={onSave} className="space-y-6 pb-28" noValidate>
      <Panel title="Photos" description="Square photos look best. The first photo is shown on product cards.">
        <ImageUploader images={d.images} onChange={(images) => set("images", images)} productName={d.name} />
      </Panel>

      <Panel title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="pf-name">Product name</FieldLabel>
            {text("name", { placeholder: "e.g. Heart Charm Bracelet", maxLength: 100 })}
            {err("name")}
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="pf-slug" hint="The product’s web address. Filled in automatically from the name.">
              Web address
            </FieldLabel>
            <div className="flex items-center rounded-2xl border-2 border-line bg-[#FBF8FC] pl-3 text-sm text-ink-soft focus-within:border-grape">
              hifivebyjia.in/products/
              <input
                id="pf-slug"
                value={d.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                className="min-w-0 flex-1 rounded-r-2xl bg-white px-2 py-2.5 text-base text-ink outline-none"
                aria-invalid={Boolean(errors.slug)}
              />
            </div>
            {err("slug")}
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="pf-shortDescription" hint="One line shown on product cards.">
              Short description
            </FieldLabel>
            {text("shortDescription", { maxLength: 200, placeholder: "e.g. Pink beads with a tiny heart charm." })}
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="pf-description">Full description</FieldLabel>
            <textarea id="pf-description" value={d.description} onChange={(e) => set("description", e.target.value)} className="input min-h-32" maxLength={3000} />
          </div>
        </div>
      </Panel>

      <Panel title="Price & stock">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="pf-price">Selling price (₹)</FieldLabel>
            {text("price", { type: "number", min: 0, inputMode: "numeric", placeholder: "70" })}
            {err("price")}
          </div>
          <div>
            <FieldLabel htmlFor="pf-compareAtPrice" optional hint="Shows as crossed out, e.g. ₹90 → ₹70.">
              Original price (₹)
            </FieldLabel>
            {text("compareAtPrice", { type: "number", min: 0, inputMode: "numeric" })}
            {pct > 0 && <p className="mt-1 text-xs font-bold text-mint-deep">Shows “{pct}% OFF”</p>}
            {err("compareAtPrice")}
          </div>
          <div>
            <FieldLabel htmlFor="pf-stock" hint="0 shows the product as sold out.">
              Stock (how many you have)
            </FieldLabel>
            {text("stock", { type: "number", min: 0, inputMode: "numeric" })}
            {err("stock")}
          </div>
          <div>
            <FieldLabel htmlFor="pf-sku" optional hint="Your own code. Created automatically if empty.">
              SKU
            </FieldLabel>
            {text("sku", { maxLength: 40 })}
          </div>
        </div>
      </Panel>

      <Panel title="Status" description="Who can see and buy this product.">
        <div id="pf-status" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Status">
          {(Object.keys(PRODUCT_STATUS_INFO) as ProductStatus[]).map((s) => (
            <label key={s} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3", d.status === s ? "border-pink-deep bg-pink-soft/40" : "border-line bg-white")}>
              <input type="radio" name="status" className="mt-1 h-4 w-4 accent-pink-deep" checked={d.status === s} onChange={() => set("status", s)} />
              <span>
                <span className="block font-bold">{PRODUCT_STATUS_INFO[s].label}</span>
                <span className="block text-xs text-ink-soft">{PRODUCT_STATUS_INFO[s].help}</span>
              </span>
            </label>
          ))}
        </div>
        {d.status === "coming_soon" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="pf-launchLabel" optional hint="e.g. “Coming this Diwali”">
                Launch message
              </FieldLabel>
              {text("launchLabel", { maxLength: 60 })}
            </div>
            <div>
              <FieldLabel htmlFor="pf-launchDate" optional>
                Expected launch date
              </FieldLabel>
              {text("launchDate", { type: "date" })}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Where it appears">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pf-category">Category</FieldLabel>
            <select id="pf-category" value={d.category} onChange={(e) => set("category", e.target.value)} className="input py-2.5" aria-invalid={Boolean(errors.category)}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {err("category")}
            <fieldset className="mt-5">
              <legend className="mb-1.5 text-sm font-bold">Made for</legend>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <Chip key={a} active={d.audience.includes(a)} onClick={() => toggleIn("audience", a)}>
                    {AUDIENCE_LABELS[a]}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <div className="mt-5">
              <FieldLabel htmlFor="pf-tags" hint="Words people might search for, separated by commas (e.g. beads, pink, gift).">
                Search tags
              </FieldLabel>
              {text("tags")}
            </div>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold">Collections</legend>
            <p className="mb-2 text-xs text-ink-soft">Some collections also add products automatically by category, audience or tags.</p>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <Chip key={c.slug} active={d.collections.includes(c.slug)} onClick={() => toggleIn("collections", c.slug)}>
                  {c.emoji} {c.name}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Toggle id="pf-featured" label="Featured" hint="Show on the homepage" checked={d.featured} onChange={(v) => set("featured", v)} />
          <Toggle id="pf-new" label="New arrival" hint="“New” badge" checked={d.newArrival} onChange={(v) => set("newArrival", v)} />
          <Toggle id="pf-best" label="Bestseller" hint="“Bestseller” badge" checked={d.bestseller} onChange={(v) => set("bestseller", v)} />
          <Toggle id="pf-sample" label="Sample listing" hint="Shows a “Sample” tag" checked={d.isSample} onChange={(v) => set("isSample", v)} />
        </div>
        <div className="mt-4 max-w-xs">
          <FieldLabel htmlFor="pf-sortOrder" hint="Lower numbers are shown first.">
            Display order
          </FieldLabel>
          {text("sortOrder", { type: "number" })}
        </div>
      </Panel>

      <Panel title="Personalisation" description="Let customers choose a size, colour, letters and more.">
        <Toggle id="pf-personalise" label="Customers can personalise this product" checked={d.personalise} onChange={(v) => set("personalise", v)} />
        {d.personalise && (
          <div className="mt-4 space-y-3">
            {d.fields.map((f, i) => (
              <div key={f.key} id={`pf-customisation`} className="rounded-2xl border border-line bg-[#FBF8FC] p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <div>
                    <FieldLabel htmlFor={`cf-label-${f.key}`}>Option name</FieldLabel>
                    <input id={`cf-label-${f.key}`} value={f.label} onChange={(e) => setField(i, { label: e.target.value })} className="input py-2" placeholder="e.g. Size" />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`cf-type-${f.key}`}>Type</FieldLabel>
                    <select id={`cf-type-${f.key}`} value={f.type} onChange={(e) => setField(i, { type: e.target.value as FieldDraft["type"] })} className="input py-2">
                      <option value="select">Choices</option>
                      <option value="text">Short text</option>
                      <option value="textarea">Long text</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => set("fields", d.fields.filter((_, j) => j !== i))} className="self-end rounded-full p-2.5 text-pink-deep hover:bg-pink-soft" aria-label={`Remove ${f.label || "option"}`}>
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                {f.type === "select" ? (
                  <div className="mt-3">
                    <FieldLabel htmlFor={`cf-opts-${f.key}`} hint="One choice per line.">
                      Choices
                    </FieldLabel>
                    <textarea id={`cf-opts-${f.key}`} value={f.optionsText ?? ""} onChange={(e) => setField(i, { optionsText: e.target.value })} className="input min-h-24 py-2" />
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor={`cf-max-${f.key}`}>Max characters</FieldLabel>
                      <input id={`cf-max-${f.key}`} type="number" min={1} value={f.maxLength ?? ""} onChange={(e) => setField(i, { maxLength: Number(e.target.value) || undefined })} className="input py-2" />
                    </div>
                    <div>
                      <FieldLabel htmlFor={`cf-ph-${f.key}`} optional>
                        Example text
                      </FieldLabel>
                      <input id={`cf-ph-${f.key}`} value={f.placeholder ?? ""} onChange={(e) => setField(i, { placeholder: e.target.value })} className="input py-2" />
                    </div>
                    {f.type === "text" && (
                      <label className="flex items-center gap-2 text-sm sm:col-span-2">
                        <input type="checkbox" className="h-4 w-4 accent-pink-deep" checked={f.pattern === "^[A-Za-z0-9 ♥]+$"} onChange={(e) => setField(i, { pattern: e.target.checked ? "^[A-Za-z0-9 ♥]+$" : undefined })} />
                        Letters, numbers, spaces and ♥ only (for letter beads)
                      </label>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" className="h-4 w-4 accent-pink-deep" checked={Boolean(f.required)} onChange={(e) => setField(i, { required: e.target.checked })} />
                    Customer must fill this in
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    Extra price ₹
                    <input type="number" min={0} value={f.priceAdjustment ?? ""} onChange={(e) => setField(i, { priceAdjustment: Number(e.target.value) || undefined })} className="w-20 rounded-xl border-2 border-line px-2 py-1" />
                  </label>
                </div>
                {errors[`customisation.${i}`] && <p className="field-error">{errors[`customisation.${i}`]}</p>}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set("fields", [...d.fields, { ...p.field, id: "", key: nextKey(), optionsText: (p.field.options ?? []).join("\n") }])}
                  className="chip bg-white px-3 py-2 text-sm text-ink shadow-sm hover:bg-pink-soft"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("fields", [...d.fields, { id: "", key: nextKey(), label: "", type: "select", required: false, optionsText: "" }])}
                className="chip bg-white px-3 py-2 text-sm text-ink shadow-sm hover:bg-pink-soft"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Blank option
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="More details" description="Optional. Shown in the product’s Details section.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pf-materials" hint="Separated by commas.">
              Materials
            </FieldLabel>
            {text("materials", { placeholder: "Acrylic beads, Elastic cord" })}
          </div>
          <div>
            <FieldLabel htmlFor="pf-care">Care instructions</FieldLabel>
            {text("care", { maxLength: 500 })}
          </div>
          <div>
            <FieldLabel htmlFor="pf-circumference" optional>
              Bracelet size (cm around)
            </FieldLabel>
            {text("circumference", { type: "number", step: "0.5", min: 0 })}
          </div>
          <div>
            <FieldLabel htmlFor="pf-length" optional>
              Length (cm)
            </FieldLabel>
            {text("length", { type: "number", step: "0.5", min: 0 })}
          </div>
          <div>
            <FieldLabel htmlFor="pf-weight" optional hint="For shipping later.">
              Weight (grams)
            </FieldLabel>
            {text("weight", { type: "number", min: 0 })}
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold text-ink-soft">Tax details (for later)</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="pf-hsn" optional>
                HSN code
              </FieldLabel>
              {text("hsn", { maxLength: 20 })}
            </div>
            <div>
              <FieldLabel htmlFor="pf-gstRate" optional hint="Leave empty until confirmed with your accountant.">
                GST rate (%)
              </FieldLabel>
              {text("gstRate", { type: "number", min: 0, max: 28 })}
            </div>
          </div>
        </details>
      </Panel>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-10">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save className="h-5 w-5" aria-hidden /> {saving ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          {product && (
            <>
              <Link href={`/products/${product.slug}`} target="_blank" className="btn btn-secondary btn-sm">
                <ExternalLink className="h-4 w-4" aria-hidden /> View
              </Link>
              <button type="button" onClick={onDuplicate} className="btn btn-ghost btn-sm">
                <Copy className="h-4 w-4" aria-hidden /> Duplicate
              </button>
              <button type="button" onClick={onDelete} className="btn btn-ghost btn-sm text-pink-deep">
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </button>
            </>
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", active ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-line bg-white hover:border-pink")}
    >
      {children}
    </button>
  );
}
