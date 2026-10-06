import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { StockEditor } from "@/components/admin/StockEditor";
import { EmptyNote, PageHeader, Pill } from "@/components/admin/ui";
import { ProductImage } from "@/components/product/ProductImage";
import { categoryName } from "@/lib/catalog";
import { PRODUCT_STATUS_INFO } from "@/lib/admin-labels";
import { formatPrice } from "@/lib/format";
import { getAllCategories, listProducts } from "@/server/admin-data";


export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const [all, categories] = await Promise.all([listProducts(), getAllCategories()]);
  const term = q.trim().toLowerCase();
  const products = all.filter(
    (p) => (!status || p.status === status) && (!term || `${p.name} ${p.sku} ${p.tags.join(" ")}`.toLowerCase().includes(term)),
  );

  return (
    <>
      <PageHeader
        title="Products"
        description={`${all.length} products · changes appear on the website straight away.`}
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> Add product
          </Link>
        }
      />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <label htmlFor="q" className="sr-only">Search products</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search by name, SKU or tag" className="input py-2.5 pl-11" />
        </div>
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" name="status" defaultValue={status} className="input w-auto py-2.5">
          <option value="">All statuses</option>
          {Object.entries(PRODUCT_STATUS_INFO).map(([value, info]) => (
            <option key={value} value={value}>{info.label}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
      </form>

      {products.length ? (
        <ul className="space-y-2">
          {products.map((p) => {
            const info = PRODUCT_STATUS_INFO[p.status];
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-3 shadow-sm sm:flex-nowrap">
                <Link href={`/admin/products/${p.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-pink-soft/40">
                  <ProductImage image={p.images[0]} alt="" sizes="64px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="font-display text-lg font-semibold hover:text-pink-deep">
                    {p.name}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    {categoryName(categories, p.category)} · {p.sku}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill tone={info.tone}>{info.label}</Pill>
                    {p.featured && <Pill tone="yellow">Featured</Pill>}
                    {p.newArrival && <Pill tone="blue">New</Pill>}
                    {p.customisable && <Pill tone="purple">Personalised</Pill>}
                    {p.isSample && <Pill>Sample</Pill>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold">{formatPrice(p.price)}</p>
                  {p.compareAtPrice ? <p className="text-xs text-ink-soft line-through">{formatPrice(p.compareAtPrice)}</p> : null}
                </div>
                <StockEditor id={p.id} stock={p.stock} />
                <Link href={`/admin/products/${p.id}`} className="btn btn-secondary btn-sm">Edit</Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote>{all.length ? "No products match this search." : "No products yet — add your first one!"}</EmptyNote>
      )}
    </>
  );
}
