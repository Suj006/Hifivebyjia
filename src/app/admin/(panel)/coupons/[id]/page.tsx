import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/CouponForm";
import { PageHeader } from "@/components/admin/ui";
import { getAllCategories, getAllCollections, getDiscount, listProducts } from "@/server/admin-data";

export const metadata: Metadata = { title: "Edit coupon" };

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [discount, categories, collections, products] = await Promise.all([getDiscount(id), getAllCategories(), getAllCollections(), listProducts()]);
  if (!discount) notFound();
  return (
    <>
      <PageHeader title={discount.code ?? discount.label} back={{ href: "/admin/coupons", label: "Coupons & offers" }} />
      <CouponForm
        key={`${discount.id}-${discount.usageCount}`}
        discount={discount}
        categories={categories}
        collections={collections}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </>
  );
}
