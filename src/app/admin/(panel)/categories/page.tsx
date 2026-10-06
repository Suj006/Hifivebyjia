import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CategoryOrderButtons } from "@/components/admin/CategoryOrderButtons";
import { EmptyNote, PageHeader, Pill } from "@/components/admin/ui";
import { PRODUCT_STATUS_INFO } from "@/lib/admin-labels";
import { pluralise } from "@/lib/format";
import { listCategoriesWithCounts } from "@/server/admin-data";
import type { ProductStatus } from "@/types";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [{ deleted }, categories] = await Promise.all([searchParams, listCategoriesWithCounts()]);
  return (
    <>
      <PageHeader
        title="Categories"
        description="What kind of product it is — used for shop filters, product pages and coupons. The order here is the order in the shop filter."
        actions={
          <Link href="/admin/categories/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> Add category
          </Link>
        }
      />
      {deleted && (
        <p role="status" className="mb-4 rounded-2xl bg-mint-soft px-4 py-3 text-sm font-bold text-mint-deep">
          Category deleted.
        </p>
      )}
      {categories.length ? (
        <ul className="space-y-2">
          {categories.map((c, i) => (
            <li key={c.slug} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl border border-line bg-white p-4 shadow-sm sm:flex-nowrap">
              <CategoryOrderButtons slug={c.slug} name={c.name} first={i === 0} last={i === categories.length - 1} />
              <div className="order-first w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
                <Link href={`/admin/categories/${c.slug}`} className="font-display text-lg font-bold hover:text-pink-deep">
                  {c.name}
                </Link>
                <p className="text-xs text-ink-soft">/shop?category={c.slug}</p>
                {c.description && <p className="text-sm text-ink-soft">{c.description}</p>}
                <div className="mt-1 flex flex-wrap gap-1">
                  {(Object.entries(c.counts) as [ProductStatus, number][]).map(([status, n]) => (
                    <Pill key={status} tone={PRODUCT_STATUS_INFO[status].tone}>
                      {n} {PRODUCT_STATUS_INFO[status].label.toLowerCase()}
                    </Pill>
                  ))}
                </div>
              </div>
              <Link href={`/admin/products?category=${c.slug}`} className="ml-auto text-sm font-bold text-ink-soft hover:text-pink-deep sm:ml-0">
                {pluralise(c.total, "product")}
              </Link>
              <Link href={`/admin/categories/${c.slug}`} className="btn btn-secondary btn-sm">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>No categories yet — add your first one.</EmptyNote>
      )}
    </>
  );
}
