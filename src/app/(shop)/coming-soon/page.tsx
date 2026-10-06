import type { Metadata } from "next";
import { Sparkle } from "@/components/brand/Decor";
import { Nainu } from "@/components/brand/Nainu";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { Reveal } from "@/components/common/Reveal";
import { NotifyMeForm } from "@/components/forms/NotifyMeForm";
import { ComingSoonCard } from "@/components/product/ComingSoonCard";
import { microcopy } from "@/content/brand";
import { comingSoonProducts } from "@/lib/catalog";
import { getStore } from "@/server/store";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Coming Soon",
  description: "Get a sneak peek at new Hi Five by Jia products that are on the way — and get notified the moment they launch.",
  path: "/coming-soon",
});

export default async function ComingSoonPage() {
  const products = comingSoonProducts((await getStore()).products);
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ name: "Coming Soon", path: "/coming-soon" }]} />
      <header className="relative mt-4 mb-12 grid items-center gap-6 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-grape-soft via-pink-soft to-sky-soft p-8 sm:p-12 md:grid-cols-[1.4fr_1fr]">
        <Sparkle className="absolute top-8 right-1/3 h-8 w-8 animate-sparkle" color="#FAAF04" />
        <Sparkle className="absolute bottom-10 left-1/2 h-5 w-5 animate-sparkle [animation-delay:1.2s]" color="#7721C2" />
        <div>
          <span className="eyebrow">Sneak peek</span>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-6xl">
            Coming Soon <span aria-hidden>✨</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">
            {microcopy.comingSoon} Here’s what Nainu is working on right now. Tap “Notify me” and you’ll be the first to know.
          </p>
        </div>
        <div className="mx-auto w-48 sm:w-60">
          <Nainu mood="celebrate" label="Nainu celebrating new products" />
        </div>
      </header>

      {products.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Reveal as="li" key={p.id}>
              <ComingSoonCard product={p} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <EmptyState mood="thinking" title="New ideas are brewing!" text="Nothing to announce just yet — check back soon." action={{ label: "Shop current favourites", href: "/shop" }} />
      )}

      <section className="mx-auto mt-16 max-w-2xl rounded-[2rem] bg-white p-6 text-center shadow-card sm:p-10" aria-labelledby="hear-first">
        <h2 id="hear-first" className="font-display text-3xl font-bold">
          Hear about new drops first
        </h2>
        <p className="mt-2 text-ink-soft">One friendly email when something new launches. That’s it.</p>
        <NotifyMeForm topic="newsletter" className="mt-6 text-left" buttonLabel="Keep me posted" />
      </section>
    </div>
  );
}
