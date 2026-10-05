import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { siteConfig } from "@/config/site";
import type { PolicySection } from "@/content/help";

interface PolicyPageProps {
  title: string;
  emoji: string;
  intro: string;
  path: string;
  sections: PolicySection[];
  updated: string;
}

export function PolicyPage({ title, emoji, intro, path, sections, updated }: PolicyPageProps) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Breadcrumbs items={[{ name: title, path }]} />
      <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
        {title} <span aria-hidden>{emoji}</span>
      </h1>
      <p className="mt-3 text-lg text-ink-soft">{intro}</p>
      <p className="mt-2 text-sm text-ink-soft">Last updated: {updated}</p>
      <div className="prose-h5 mt-6 rounded-[2rem] bg-white p-6 shadow-card sm:p-10">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="first:mt-0">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
        <p className="mt-10 text-sm">
          Questions? Email <a href={`mailto:${siteConfig.contact.email}`} className="font-bold text-pink-deep">{siteConfig.contact.email}</a>.
        </p>
      </div>
    </div>
  );
}
