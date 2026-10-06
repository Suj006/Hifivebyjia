import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/CouponForm";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories, getAllCollections, listProducts } from "@/server/admin-data";

export const metadata: Metadata = { title: "New coupon" };

export default async function NewCouponPage() {
  const [categories, collections, products] = await Promise.all([getAllCategories(), getAllCollections(), listProducts()]);
  return (
    <>
      <PageHeader title="New coupon or offer" back={{ href: "/admin/coupons", label: "Coupons & offers" }} />
      <CouponForm categories={categories} collections={collections} products={products.map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
