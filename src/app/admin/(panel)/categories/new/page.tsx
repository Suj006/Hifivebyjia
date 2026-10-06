import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories } from "@/server/admin-data";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  const categories = await getAllCategories();
  return (
    <>
      <PageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm others={categories} productCount={0} />
    </>
  );
}
