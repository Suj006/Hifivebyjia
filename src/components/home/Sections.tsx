import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeadString, Sparkle } from "@/components/brand/Decor";
import { Nainu } from "@/components/brand/Nainu";
import { InstagramIcon } from "@/components/brand/SocialIcons";
import { EmptyState } from "@/components/common/EmptyState";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { StarRating } from "@/components/common/StarRating";
import { ProductImage } from "@/components/product/ProductImage";
import { siteConfig } from "@/config/site";
import { founder, meetNainu, microcopy, vision, whyHi5 } from "@/content/brand";
import { getProductById, getShopProducts } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { getFeaturedReviews } from "@/lib/reviews";

export function MeetNainuSection() {
  return (
    <section className="container-page" aria-labelledby="meet-nainu">
      <Reveal className="relative grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-sunny-soft via-pink-soft to-grape-soft p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:p-14">
        <Sparkle className="absolute top-8 right-10 h-8 w-8 animate-sparkle" color="#ED0C68" />
        <div className="relative mx-auto w-56 sm:w-72">
          <div className="absolute inset-4 rounded-full bg-white/70" aria-hidden />
          <Nainu mood="happy" label="Illustration of Nainu, the Hi 5 by Jia mascot" className="relative" />
        </div>
        <div>
          <span className="eyebrow">The founder</span>
          <h2 id="meet-nainu" className="section-title mt-4">
            {meetNainu.title} <span aria-hidden>💖</span>
          </h2>
          <p className="mt-5 font-display text-2xl leading-snug font-medium text-ink">“{meetNainu.greeting}”</p>
          <p className="mt-4 text-lg text-ink-soft">{meetNainu.paragraphs[0]}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {founder.loves.map((l) => (
              <li key={l.id} className="chip bg-white px-4 py-2 text-sm text-ink shadow-sm">
                <span aria-hidden>{l.emoji}</span> {l.title}
              </li>
            ))}
          </ul>
          <Link href="/about" className="btn btn-primary mt-8">
            Read Nainu’s story <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export function WhySection() {
  const colors = ["bg-pink-soft", "bg-sky-soft", "bg-sunny-soft", "bg-mint-soft"];
  return (
    <section className="container-page" aria-labelledby="why-hi5">
      <SectionHeading id="why-hi5" eyebrow="Why Hi 5 by Jia" title="Little details. Big smiles." align="center" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whyHi5.map((item, i) => (
          <Reveal as="li" key={item.title} className="card p-6 transition hover:-translate-y-1">
            <span className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl ${colors[i % colors.length]}`} aria-hidden>
              {item.emoji}
            </span>
            <h3 className="mt-4 font-display text-xl font-bold">{item.title}</h3>
            <p className="mt-2 text-ink-soft">{item.text}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function VisionSection() {
  return (
    <section className="container-page" aria-labelledby="vision">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-ink p-8 text-white sm:p-12 lg:p-16">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-grape/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-pink/30 blur-3xl" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="chip bg-white/10 px-4 py-1.5 text-sunny">🌱 Our dream</span>
            <h2 id="vision" className="mt-4 font-display text-4xl font-bold sm:text-5xl">
              {vision.title}
            </h2>
            <div className="mt-6 space-y-4 text-lg text-white/80">
              {vision.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <Link href="/creator-collaborations" className="btn mt-8 bg-white text-ink hover:-translate-y-0.5 hover:bg-sunny">
              Creator Collaborations <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
          <div className="relative rounded-[2rem] border border-white/15 bg-white/5 p-6 backdrop-blur">
            <span className="chip bg-sunny text-ink">{vision.badge}</span>
            <ul className="mt-5 space-y-4">
              {["Young creators share their products", "Special collaboration collections", "Parent/guardian-approved onboarding"].map((t, i) => (
                <li key={t} className="flex items-center gap-3 text-white/90">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-bold text-ink ${["bg-pink", "bg-sky", "bg-mint"][i]}`}>
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function ReviewsShowcase() {
  const reviews = getFeaturedReviews(6);
  return (
    <section className="container-page" aria-labelledby="customer-love">
      <SectionHeading id="customer-love" eyebrow="Customer love" title={<>Loved by Our Customers <span aria-hidden>❤️</span></>} align="center" />
      {reviews.length ? (
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const product = getProductById(r.productId);
            return (
              <Reveal as="li" key={r.id} className="card flex flex-col p-6">
                <StarRating value={r.rating} />
                {r.title && <h3 className="mt-3 font-display text-lg font-bold">{r.title}</h3>}
                <p className="mt-2 flex-1 text-ink-soft">“{r.text}”</p>
                <p className="mt-4 text-sm font-bold">
                  {r.name}
                  <span className="font-normal text-ink-soft"> · {formatDate(r.createdAt)}</span>
                </p>
                {product && (
                  <Link href={`/products/${product.slug}`} className="mt-1 text-sm font-bold text-pink-deep hover:underline">
                    {product.name}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          compact
          mood="celebrate"
          title={microcopy.noReviews}
          text="Bought something from Hi 5 by Jia? Head to the product page and tell us how it went."
          action={{ label: "Shop & review", href: "/shop" }}
          className="mx-auto mt-10 max-w-2xl"
        />
      )}
    </section>
  );
}

export function InstagramSection() {
  const tiles = getShopProducts().slice(0, 6);
  return (
    <section className="container-page" aria-labelledby="instagram">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <span className="eyebrow">
            <InstagramIcon className="h-3.5 w-3.5" /> On Instagram
          </span>
          <h2 id="instagram" className="section-title mt-4">
            Follow <span className="text-gradient">{siteConfig.social.instagram.handle}</span>
          </h2>
          <p className="section-lead">New designs, behind-the-scenes bead sorting and first looks at what’s coming next.</p>
          <a href={siteConfig.social.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-8">
            <InstagramIcon /> Follow on Instagram
          </a>
        </Reveal>
        {/* Phase 2: replace these tiles with a live Instagram feed (see docs/ARCHITECTURE.md). */}
        <ul className="grid grid-cols-3 gap-2 sm:gap-3">
          {tiles.map((p, i) => (
            <Reveal as="li" key={p.id}>
              <a
                href={siteConfig.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-2xl sm:rounded-3xl"
                aria-label={`${p.name} – see more on Instagram`}
              >
                <ProductImage image={p.images[i % p.images.length]} alt="" sizes="(min-width: 1024px) 18vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/30 group-hover:opacity-100">
                  <InstagramIcon className="h-7 w-7" />
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="container-page" aria-labelledby="final-cta">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-r from-pink-deep via-grape-deep to-sky-deep px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <Sparkle className="absolute top-8 left-10 h-8 w-8 animate-sparkle" color="#FAAF04" />
        <Sparkle className="absolute right-12 bottom-10 h-6 w-6 animate-sparkle [animation-delay:1s]" color="#FFFFFF" />
        <BeadString className="mx-auto w-48 opacity-90" />
        <h2 id="final-cta" className="mt-6 font-display text-4xl font-bold sm:text-6xl">
          Ready for your Hi 5? <span aria-hidden>✋</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">Find a favourite for yourself — or a little something to make someone smile.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn bg-white px-8 text-lg text-ink hover:-translate-y-0.5 hover:bg-sunny">
            Shop the collection
          </Link>
          <Link href="/categories/gifts" className="btn border-2 border-white/60 px-8 text-lg text-white hover:bg-white/10">
            Find a gift 🎁
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
