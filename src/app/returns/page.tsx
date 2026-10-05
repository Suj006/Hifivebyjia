import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";
import { returnsPolicy } from "@/content/help";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Returns & Refunds",
  description: "Hi 5 by Jia returns, refunds and cancellation policy for handmade and personalised products.",
  path: "/returns",
});

export default function Page() {
  return <PolicyPage title="Returns & Refunds" emoji="🔁" intro="If something isn’t right, we’ll make it right." path="/returns" sections={returnsPolicy} updated="5 October 2026" />;
}
