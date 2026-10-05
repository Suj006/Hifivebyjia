import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { Sparkle } from "@/components/brand/Decor";
import { Nainu } from "@/components/brand/Nainu";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Reveal } from "@/components/common/Reveal";
import { NotifyMeForm } from "@/components/forms/NotifyMeForm";
import { siteConfig } from "@/config/site";
import { creatorCollab } from "@/content/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Creator Collaborations",
  description:
    "Made by young creators, shared with the world. Hi Five by Jia is exploring collaborations with young makers — with parent/guardian involvement every step of the way.",
  path: "/creator-collaborations",
});

export default function CreatorCollaborationsPage() {
  const mail = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent("Creator collaboration idea")}`;
  return (
    <div className="pb-8">
      <section className="relative overflow-hidden bg-ink pt-8 pb-16 text-white sm:pt-12 sm:pb-24" aria-labelledby="collab-title">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-pink/30 blur-3xl" aria-hidden />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-sky/25 blur-3xl" aria-hidden />
        <div className="container-page relative">
          <Breadcrumbs tone="dark" items={[{ name: "Creator Collaborations", path: "/creator-collaborations" }]} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="chip bg-sunny px-4 py-1.5 text-ink">✨ Coming soon</span>
              <h1 id="collab-title" className="mt-5 font-display text-4xl leading-tight font-bold sm:text-6xl">
                {creatorCollab.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/80">{creatorCollab.intro}</p>
            </div>
            <div className="relative mx-auto w-56 sm:w-72">
              <Sparkle className="absolute top-0 left-0 h-8 w-8 animate-sparkle" color="#FAAF04" />
              <Sparkle className="absolute right-0 bottom-12 h-6 w-6 animate-sparkle [animation-delay:1s]" color="#ED0C68" />
              <div className="absolute inset-6 rounded-full bg-white/10" aria-hidden />
              <Nainu mood="celebrate" className="relative" label="Nainu celebrating creator collaborations" />
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-10 sm:-mt-14" aria-labelledby="possibilities">
        <h2 id="possibilities" className="sr-only">
          Future possibilities
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {creatorCollab.possibilities.map((p) => (
            <Reveal as="li" key={p.title} className="card relative p-6">
              <span className="chip absolute top-4 right-4 bg-grape-soft text-grape-deep">Soon</span>
              <span className="text-3xl" aria-hidden>
                {p.emoji}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{p.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="container-page mt-20 grid gap-6 lg:grid-cols-2" aria-label="Get involved">
        <Reveal className="rounded-[2rem] bg-linear-to-br from-pink-soft to-sunny-soft p-8 sm:p-10">
          <h2 className="font-display text-3xl font-bold">Interested in collaborating?</h2>
          <p className="mt-3 text-lg text-ink-soft">
            Are you a young creator (or the parent of one) who makes something special? We’d love to hear about it. Public creator sign-ups aren’t open yet — for now, just send us an email.
          </p>
          <a href={mail} className="btn btn-primary mt-6">
            <Mail className="h-5 w-5" aria-hidden /> {siteConfig.contact.email}
          </a>
          <div className="mt-8 rounded-2xl bg-white/80 p-5">
            <p className="font-bold">Want to know when collaborations open?</p>
            <NotifyMeForm topic="creator-collaborations" compact className="mt-3" buttonLabel="Notify me" />
          </div>
        </Reveal>
        <Reveal className="rounded-[2rem] border-2 border-mint/40 bg-mint-soft/60 p-8 sm:p-10">
          <ShieldCheck className="h-10 w-10 text-mint-deep" aria-hidden />
          <h2 className="mt-4 font-display text-3xl font-bold">Safety first, always</h2>
          <p className="mt-3 text-lg text-ink-soft">{creatorCollab.safety}</p>
          <ul className="mt-6 space-y-3 text-ink">
            {[
              "Parent/guardian consent required for every creator under 18",
              "Creators’ personal details are never published",
              "Every product is reviewed before it’s listed",
              "Fair, transparent collaboration terms agreed with families",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-sm font-bold text-ink" aria-hidden>
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </div>
  );
}
