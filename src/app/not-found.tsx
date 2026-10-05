import type { Metadata } from "next";
import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Sparkle } from "@/components/brand/Decor";
import { Nainu } from "@/components/brand/Nainu";
import { microcopy } from "@/content/brand";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
      <div className="relative w-56 sm:w-64">
        <Sparkle className="absolute top-0 left-0 h-8 w-8 animate-sparkle" color="#FAAF04" />
        <Sparkle className="absolute right-2 bottom-16 h-6 w-6 animate-sparkle [animation-delay:1s]" color="#01BDC6" />
        <span className="absolute -top-2 right-0 animate-float text-5xl" aria-hidden>
          🚀
        </span>
        <Nainu mood="oops" />
      </div>
      <p className="mt-6 font-display text-7xl font-bold text-pink-deep sm:text-8xl">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{microcopy.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-lg text-ink-soft">{microcopy.notFoundText} Let’s get you back to the fun stuff.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">
          <Home className="h-5 w-5" aria-hidden /> Take Me Home
        </Link>
        <Link href="/shop" className="btn btn-secondary">
          <Search className="h-5 w-5" aria-hidden /> Browse the shop
        </Link>
      </div>
    </div>
  );
}
