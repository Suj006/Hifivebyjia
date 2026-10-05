import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";
import { termsOfService } from "@/content/help";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "Terms of service for shopping with Hi 5 by Jia.",
  path: "/terms",
});

export default function Page() {
  return <PolicyPage title="Terms of Service" emoji="📜" intro="The friendly rules for using our website and placing orders." path="/terms" sections={termsOfService} updated="5 October 2026" />;
}
