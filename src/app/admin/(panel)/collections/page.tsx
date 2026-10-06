import type { Metadata } from "next";
import { CollectionsEditor } from "@/components/admin/CollectionsEditor";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories, getAllCollections } from "@/server/admin-data";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsAdminPage() {
  const [collections, categories] = await Promise.all([getAllCollections(), getAllCategories()]);
  return (
    <>
      <PageHeader title="Collections & categories" description="Organise how products are grouped on the website." />
      <CollectionsEditor collections={[...collections].sort((a, b) => a.sortOrder - b.sortOrder)} categories={categories} />
    </>
  );
}
