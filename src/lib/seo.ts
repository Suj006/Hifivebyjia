import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";
import type { Product, Review } from "@/types";

interface PageMetaInput {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  /** Use the title as-is (no " | Hi 5 by Jia" suffix). */
  absoluteTitle?: boolean;
}

export function pageMetadata({ title, description, path, image, noIndex, absoluteTitle }: PageMetaInput): Metadata {
  const desc = description ?? siteConfig.description;
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  // Social networks don't render SVG previews, so illustrations fall back to the default share image.
  const shareable = image && !image.endsWith(".svg");
  const images = shareable
    ? [{ url: absoluteUrl(image), width: 1200, height: 1200, alt: title }]
    : [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: siteConfig.defaultTitle }];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: images.map((i) => i.url),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/* ---------------------------- JSON-LD ---------------------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    ...(siteConfig.logo ? { logo: absoluteUrl(siteConfig.logo.src) } : {}),
    sameAs: [siteConfig.social.instagram.url],
    slogan: siteConfig.tagline,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: Product, reviews: Review[]) {
  const availability =
    product.status === "coming_soon"
      ? "https://schema.org/PreOrder"
      : product.status === "active" && product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images.map((i) => absoluteUrl(i.src)),
    brand: { "@type": "Brand", name: siteConfig.name },
    category: product.category,
    url: absoluteUrl(`/products/${product.slug}`),
    offers: {
      "@type": "Offer",
      priceCurrency: siteConfig.commerce.currency,
      price: product.price,
      availability,
      url: absoluteUrl(`/products/${product.slug}`),
      seller: { "@type": "Organization", name: siteConfig.name },
    },
  };

  // Only genuine, approved reviews are ever included.
  if (reviews.length) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: reviews.length,
    };
    data.review = reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.createdAt.slice(0, 10),
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    }));
  }
  return data;
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}
