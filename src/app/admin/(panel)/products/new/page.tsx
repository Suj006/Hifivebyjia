import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories, getAllCollections } from "@/server/admin-data";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ category }, categories, collections] = await Promise.all([searchParams, getAllCategories(), getAllCollections()]);
  return (
    <>
      <PageHeader title="Add a product" back={{ href: "/admin/products", label: "Products" }} description="Fill in the details and press “Create product”." />
      <ProductForm categories={categories} collections={collections} defaultCategory={category} />
    </>
  );
}
