import type { Metadata } from "next";
import Link from "next/link";
import { CollectionsEditor } from "@/components/admin/CollectionsEditor";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories, getAllCollections } from "@/server/admin-data";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsAdminPage() {
  const [collections, categories] = await Promise.all([getAllCollections(), getAllCategories()]);
  return (
    <>
      <PageHeader
        title="Collections"
        description={
          <>
            Themed groups shown in “Shop by Collection”. Product types (Bracelets, Keychains…) are managed under{" "}
            <Link href="/admin/categories" className="font-bold text-pink-deep underline">
              Categories
            </Link>
            .
          </>
        }
      />
      <CollectionsEditor collections={[...collections].sort((a, b) => a.sortOrder - b.sortOrder)} categories={categories} />
    </>
  );
}
