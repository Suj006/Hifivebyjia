import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Hero, Marquee } from "@/components/home/Hero";
import {
  FinalCta,
  InstagramSection,
  MeetNainuSection,
  ReviewsShowcase,
  VisionSection,
  WhySection,
} from "@/components/home/Sections";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ComingSoonCard } from "@/components/product/ComingSoonCard";
import { ProductGrid } from "@/components/product/ProductCard";
import { siteConfig } from "@/config/site";
import { microcopy } from "@/content/brand";
import { getCollections, getComingSoonProducts, getFeaturedProducts, getNewArrivals } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

const viewAll = (href: string, label: string) => (
  <Link href={href} className="btn btn-secondary btn-sm self-start sm:self-auto">
    {label} <ArrowRight className="h-4 w-4" aria-hidden />
  </Link>
);

export default function HomePage() {
  const featured = getFeaturedProducts(8);
  const newArrivals = getNewArrivals(4);
  const collections = getCollections();
  const comingSoon = getComingSoonProducts().slice(0, 4);

  return (
    <div className="space-y-20 sm:space-y-28">
      <div>
        <Hero />
        <Marquee />
      </div>

      <section className="container-page" aria-labelledby="featured">
        <SectionHeading
          id="featured"
          eyebrow="Featured"
          title="Fan favourites"
          lead="The pieces everyone keeps asking for — strung by hand in happy colours."
          action={viewAll("/shop", "Shop all")}
        />
        <div className="mt-8">
          <ProductGrid products={featured} />
        </div>
      </section>

      <section className="container-page" aria-labelledby="collections">
        <SectionHeading
          id="collections"
          eyebrow="Collections"
          title="Shop by Collection"
          lead="Find your vibe — for kids, teens, grown-ups and gifting."
          action={viewAll("/categories", "All collections")}
        />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {collections.map((c) => (
            <Reveal as="li" key={c.slug}>
              <CollectionCard collection={c} />
            </Reveal>
          ))}
        </ul>
      </section>

      {newArrivals.length > 0 && (
        <section className="container-page" aria-labelledby="new-arrivals">
          <SectionHeading
            id="new-arrivals"
            eyebrow="Just dropped"
            title="New Arrivals"
            lead="Fresh off the bead tray."
            action={viewAll("/shop?sort=newest", "See what’s new")}
          />
          <div className="mt-8">
            <ProductGrid products={newArrivals} />
          </div>
        </section>
      )}

      {comingSoon.length > 0 && (
        <section className="relative overflow-hidden bg-grape-soft/60 py-16 sm:py-20" aria-labelledby="coming-soon">
          <div className="container-page">
            <SectionHeading
              id="coming-soon"
              eyebrow="Sneak peek"
              title={<>Coming Soon <span aria-hidden>✨</span></>}
              lead={microcopy.comingSoon}
              action={viewAll("/coming-soon", "See all")}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {comingSoon.map((p) => (
                <Reveal as="li" key={p.id}>
                  <ComingSoonCard product={p} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <MeetNainuSection />
      <WhySection />
      <VisionSection />
      <ReviewsShowcase />
      <InstagramSection />
      <FinalCta />
    </div>
  );
}
