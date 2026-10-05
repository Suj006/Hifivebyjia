import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeadString, Sparkle, Squiggle } from "@/components/brand/Decor";
import { Nainu } from "@/components/brand/Nainu";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Reveal } from "@/components/common/Reveal";
import { founder, journey, meetNainu, originStory, whatsNext } from "@/content/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Nainu – The Story of Hi 5 by Jia",
  description:
    "Meet Jia (Nainu at home), the young creator behind Hi 5 by Jia. Discover how a few handmade bracelets became a brand — and where it’s going next.",
  path: "/about",
});

const LOVE_COLORS = ["bg-sky-soft", "bg-pink-soft", "bg-sunny-soft", "bg-grape-soft"];

export default function AboutPage() {
  return (
    <div className="space-y-20 pb-8 sm:space-y-28">
      {/* Meet Nainu */}
      <section className="relative overflow-hidden bg-linear-to-b from-pink-soft/70 to-cream pt-8 pb-12 sm:pt-12" aria-labelledby="about-title">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div className="relative mx-auto w-64 sm:w-80">
              <div className="absolute inset-6 rounded-full bg-linear-to-br from-sunny via-pink to-grape opacity-80" aria-hidden />
              <Sparkle className="absolute top-2 right-4 h-8 w-8 animate-sparkle" color="#FAAF04" />
              <Sparkle className="absolute bottom-10 left-0 h-6 w-6 animate-sparkle [animation-delay:1s]" color="#01BDC6" />
              <Nainu mood="wave" className="relative" label="Illustration of Nainu waving — a stylised mascot, not a photo" />
              <p className="mt-2 text-center text-xs text-ink-soft">Nainu, as our brand mascot ✏️</p>
            </div>
            <div>
              <span className="eyebrow">Hi, I’m the founder!</span>
              <h1 id="about-title" className="mt-4 font-display text-5xl font-bold sm:text-6xl">
                {meetNainu.title} <span aria-hidden>💖</span>
              </h1>
              <p className="mt-6 font-display text-2xl leading-snug font-medium">{meetNainu.greeting}</p>
              <div className="mt-4 space-y-4 text-lg text-ink-soft">
                {meetNainu.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="mt-6 font-display text-3xl font-bold text-pink-deep">{meetNainu.signOff}</p>
              {founder.school.showGradePublicly && (
                <p className="mt-4 text-sm text-ink-soft">
                  {founder.name} is currently studying in {founder.grade}.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it started */}
      <section className="container-page" aria-labelledby="origin">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">How Hi 5 Started</span>
          <h2 id="origin" className="section-title mt-4">
            “{originStory.lead}”
          </h2>
          <Squiggle className="mx-auto mt-4 h-4 w-40 text-sunny" color="currentColor" />
          <div className="mt-6 space-y-4 text-lg text-ink-soft">
            {originStory.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* What Nainu loves */}
      <section className="container-page" aria-labelledby="loves">
        <div className="text-center">
          <span className="eyebrow">What Nainu Loves</span>
          <h2 id="loves" className="section-title mt-4">
            The things that spark the ideas
          </h2>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {founder.loves.map((l, i) => (
            <Reveal as="li" key={l.id} className={`rounded-[2rem] p-6 transition hover:-translate-y-1 hover:rotate-1 ${LOVE_COLORS[i % LOVE_COLORS.length]}`}>
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl shadow-sm" aria-hidden>
                {l.emoji}
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold">{l.title}</h3>
              <p className="mt-2 text-ink-soft">{l.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Journey */}
      <section className="container-page" aria-labelledby="journey">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-card sm:p-12">
          <div className="text-center">
            <span className="eyebrow">{journey.title}</span>
            <h2 id="journey" className="section-title mt-4">
              {journey.tagline}
            </h2>
          </div>
          <ol className="relative mt-12 grid gap-8 md:grid-cols-4">
            <div className="absolute top-6 right-[12%] left-[12%] hidden h-1 rounded-full bg-linear-to-r from-pink via-sunny to-sky md:block" aria-hidden />
            {journey.steps.map((s, i) => (
              <Reveal as="li" key={s.title} className="relative text-center">
                <span className={`relative mx-auto grid h-12 w-12 place-items-center rounded-full font-display text-xl font-bold text-white shadow-soft ${["bg-pink-deep", "bg-tangerine", "bg-grape", "bg-sky-deep"][i]}`}>
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-ink-soft">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* What's next */}
      <section className="container-page" aria-labelledby="next">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <span className="eyebrow">What’s Next</span>
            <h2 id="next" className="section-title mt-4">
              This is just the beginning
            </h2>
            <p className="section-lead">Hi 5 by Jia is starting small — and dreaming big. Here’s what’s on the horizon.</p>
            <BeadString className="mt-6 w-56" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                Shop the collection <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="/creator-collaborations" className="btn btn-secondary">
                Creator Collaborations
              </Link>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {whatsNext.map((w) => (
              <Reveal as="li" key={w.title} className="card p-6">
                <span className="text-3xl" aria-hidden>
                  {w.emoji}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold">{w.title}</h3>
                <p className="mt-1 text-ink-soft">{w.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
