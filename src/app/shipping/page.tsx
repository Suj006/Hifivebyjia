import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";
import { shippingPolicy } from "@/content/help";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shipping",
  description: "Shipping information for Hi Five by Jia orders across India: costs, free shipping threshold and delivery times.",
  path: "/shipping",
});

export default function Page() {
  return <PolicyPage title="Shipping" emoji="🚚" intro="How and when your Hi Five goodies travel to you." path="/shipping" sections={shippingPolicy} updated="5 October 2026" />;
}
