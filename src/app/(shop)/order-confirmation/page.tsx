import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Order Confirmation",
  description: "Your Hi Five by Jia order request.",
  path: "/order-confirmation",
  noIndex: true,
});

export default function OrderConfirmationPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse rounded-[2rem] bg-white" />}>
        <OrderConfirmation />
      </Suspense>
    </div>
  );
}
