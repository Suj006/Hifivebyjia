import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories, getAllCollections, getProduct } from "@/server/admin-data";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, categories, collections] = await Promise.all([getProduct(id), getAllCategories(), getAllCollections()]);
  if (!product) notFound();
  return (
    <>
      <PageHeader title={product.name} back={{ href: "/admin/products", label: "Products" }} />
      {created && <p className="mb-4 rounded-2xl bg-mint-soft px-4 py-3 font-bold text-mint-deep" role="status">Product created! It’s now live on the website (if its status is “On sale”).</p>}
      <ProductForm key={product.updatedAt} product={product} categories={categories} collections={collections} />
    </>
  );
}
