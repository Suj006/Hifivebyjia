import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { JsonLd } from "@/components/common/JsonLd";
import { getFaqs } from "@/content/help";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { getStore } from "@/server/store";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: "Answers to common questions about ordering, sizing, personalisation, shipping and returns at Hi Five by Jia.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = getFaqs((await getStore()).settings);
  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <JsonLd data={faqJsonLd(faqs.flatMap((g) => g.items))} />
      <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
      <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
        Questions? We’ve got answers <span aria-hidden>💬</span>
      </h1>
      <p className="mt-3 text-lg text-ink-soft">
        Can’t find what you’re looking for? <Link href="/contact" className="font-bold text-pink-deep hover:underline">Contact us</Link>.
      </p>
      <div className="mt-10 space-y-10">
        {faqs.map((group) => (
          <section key={group.title} aria-labelledby={`faq-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
            <h2 id={`faq-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="font-display text-2xl font-bold">
              {group.title}
            </h2>
            <div className="mt-4 space-y-3">
              {group.items.map((item) => (
                <details key={item.q} className="group card p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                    {item.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-soft text-pink-deep transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-ink-soft">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
