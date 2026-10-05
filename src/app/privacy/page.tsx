import type { Metadata } from "next";
import { PolicyPage } from "@/components/common/PolicyPage";
import { privacyPolicy } from "@/content/help";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Hi Five by Jia collects, uses and protects your information, including children’s privacy.",
  path: "/privacy",
});

export default function Page() {
  return <PolicyPage title="Privacy Policy" emoji="🔒" intro="We collect as little as possible and never sell your data." path="/privacy" sections={privacyPolicy} updated="5 October 2026" />;
}
