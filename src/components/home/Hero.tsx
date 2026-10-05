import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Blob, Sparkle, Squiggle } from "@/components/brand/Decor";
import { Nainu } from "@/components/brand/Nainu";
import { ProductImage } from "@/components/product/ProductImage";
import { heroCopy } from "@/content/brand";
import { getProductBySlug } from "@/lib/catalog";

const FLOATING = [
  { slug: "alphabet-bead-bracelet", className: "left-[2%] top-[6%] w-28 sm:w-36 lg:w-44 rotate-[-10deg]", delay: "0s" },
  { slug: "bead-bracelet", className: "right-[0%] top-[0%] w-24 sm:w-32 lg:w-40 rotate-[12deg]", delay: "-2s" },
  { slug: "keychain", className: "right-[4%] bottom-[8%] w-20 sm:w-28 lg:w-32 rotate-[-6deg]", delay: "-4s" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 sm:pb-16" aria-labelledby="hero-title">
      {/* soft background shapes */}
      <Blob className="absolute -top-24 -left-24 w-80 text-pink-soft sm:w-[28rem]" color="currentColor" />
      <Blob className="absolute top-40 -right-32 w-96 rotate-90 text-sky-soft sm:w-[32rem]" color="currentColor" />
      <Blob className="absolute -bottom-32 left-1/3 w-72 text-sunny-soft" color="currentColor" />

      <div className="container-page relative grid items-center gap-10 pt-6 sm:pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:pt-14">
        <div className="relative z-10 text-center lg:text-left">
          <span className="eyebrow animate-fade-up">
            <Sparkle className="h-3.5 w-3.5" color="#FFC93C" /> {heroCopy.eyebrow}
          </span>
          <h1 id="hero-title" className="mt-5 animate-fade-up text-[2.6rem] leading-[1.02] font-bold [animation-delay:80ms] sm:text-6xl lg:text-7xl">
            Made with <span className="relative inline-block text-pink-deep">
              Creativity.
              <Squiggle className="absolute -bottom-3 left-0 h-3 w-full text-sunny sm:h-4" color="currentColor" />
            </span>
            <br />
            Shared with a <span className="text-gradient">Smile.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-ink-soft [animation-delay:160ms] sm:text-xl lg:mx-0">
            {heroCopy.subheadline}
          </p>
          <div className="mt-8 flex animate-fade-up flex-col justify-center gap-3 [animation-delay:240ms] sm:flex-row lg:justify-start">
            <Link href="/shop" className="btn btn-primary px-8 text-lg">
              Shop Now <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href="/about" className="btn btn-secondary px-8 text-lg">
              Meet Nainu <span aria-hidden>👋</span>
            </Link>
          </div>
          <ul className="mt-8 flex animate-fade-up flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold text-ink-soft [animation-delay:320ms] lg:justify-start">
            <li>🤲 Handmade</li>
            <li>🔤 Personalised</li>
            <li>🎁 Gift-ready</li>
          </ul>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-lg">
          <div className="absolute inset-[12%] rounded-full bg-linear-to-br from-pink via-grape to-sky opacity-90" aria-hidden />
          <div className="absolute inset-[14%] rounded-full bg-cream/30 backdrop-blur-[1px]" aria-hidden />
          <div className="absolute inset-x-[18%] bottom-[4%] animate-bounce-in">
            <Nainu mood="wave" label="Nainu, the Hi 5 by Jia mascot, waving hello" />
          </div>
          {FLOATING.map((f) => {
            const p = getProductBySlug(f.slug);
            if (!p) return null;
            return (
              <Link
                key={f.slug}
                href={`/products/${p.slug}`}
                className={`absolute ${f.className} animate-float rounded-3xl bg-white p-1.5 shadow-soft transition hover:scale-105`}
                style={{ animationDelay: f.delay }}
                aria-label={p.name}
              >
                <ProductImage image={p.images[0]} alt="" priority sizes="176px" className="h-auto w-full rounded-[1.2rem]" />
              </Link>
            );
          })}
          <Sparkle className="absolute top-[36%] left-[4%] h-7 w-7 animate-sparkle" color="#FFC93C" />
          <Sparkle className="absolute top-[18%] right-[30%] h-5 w-5 animate-sparkle [animation-delay:1s]" color="#36C5F0" />
          <Sparkle className="absolute right-[2%] bottom-[40%] h-6 w-6 animate-sparkle [animation-delay:1.6s]" color="#FF4F9A" />
          <div className="absolute bottom-[14%] left-[0%] animate-float rounded-2xl bg-white px-4 py-2 font-display font-bold shadow-soft [animation-delay:-3s]">
            Hi 5! <span aria-hidden>✋</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const words = ["Handmade", "Colourful", "Personalised", "Gift-ready", "Made with a smile", "For kids, teens & grown-ups"];
  const row = [...words, ...words];
  return (
    <div className="relative -rotate-1 overflow-hidden bg-ink py-4 text-white" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-8 font-display text-xl font-semibold whitespace-nowrap sm:text-2xl">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-8">
            {w}
            <span className={["text-pink", "text-sunny", "text-sky", "text-mint"][i % 4]}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
