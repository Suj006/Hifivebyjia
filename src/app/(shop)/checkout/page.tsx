import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Complete your Hi Five by Jia order.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/cart" className="text-sm font-bold text-ink-soft hover:text-pink-deep">
        ← Back to cart
      </Link>
      <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Checkout</h1>
      <p className="mt-2 text-lg text-ink-soft">Almost there! Just a few details and your Hi Five is on its way.</p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
