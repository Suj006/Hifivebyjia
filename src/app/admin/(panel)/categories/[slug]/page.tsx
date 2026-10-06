import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { PRODUCT_STATUS_INFO } from "@/lib/admin-labels";
import { getAllCategories, listProducts } from "@/server/admin-data";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ created?: string; saved?: string }> }) {
  const [{ slug }, { created, saved }, categories, products] = await Promise.all([params, searchParams, getAllCategories(), listProducts()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const inCategory = products.filter((p) => p.category === slug);

  return (
    <>
      <PageHeader
        title={category.name}
        back={{ href: "/admin/categories", label: "Categories" }}
        actions={
          <Link href={`/admin/products/new?category=${slug}`} className="btn btn-secondary btn-sm">
            Add a product in this category
          </Link>
        }
      />
      {(created || saved) && (
        <p role="status" className="mb-4 rounded-2xl bg-mint-soft px-4 py-3 text-sm font-bold text-mint-deep">
          {created ? "Category created! You can now choose it when adding products." : "Saved! The website is updated."}
        </p>
      )}
      <div className="space-y-6">
        <CategoryForm key={slug} category={category} others={categories.filter((c) => c.slug !== slug)} productCount={inCategory.length} />
        <Panel title={`Products in ${category.name}`}>
          {inCategory.length ? (
            <ul className="divide-y divide-line">
              {inCategory.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-pink-deep">
                    {p.name}
                  </Link>
                  <Pill tone={PRODUCT_STATUS_INFO[p.status].tone}>{PRODUCT_STATUS_INFO[p.status].label}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">No products yet. Choose this category when adding or editing a product.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
