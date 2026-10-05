import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Nainu } from "@/components/brand/Nainu";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/SocialIcons";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ContactForm } from "@/components/forms/ContactForm";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with Hi 5 by Jia — questions, custom orders and collaboration ideas are all welcome.",
  path: "/contact",
});

export default function ContactPage() {
  const wa = siteConfig.contact.whatsappNumber;
  const channels = [
    { icon: Mail, label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}`, bg: "bg-pink-soft", fg: "text-pink-deep", external: false },
    {
      icon: InstagramIcon,
      label: "Instagram",
      value: siteConfig.social.instagram.handle,
      href: siteConfig.social.instagram.url,
      bg: "bg-grape-soft",
      fg: "text-grape-deep",
      external: true,
    },
    ...(wa
      ? [{ icon: WhatsAppIcon, label: "WhatsApp", value: "Chat with us", href: whatsappLink(`Hi ${siteConfig.name}! ✋`), bg: "bg-mint-soft", fg: "text-mint-deep", external: true }]
      : []),
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Say hi! <span aria-hidden>👋</span>
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Questions, custom order ideas, collaboration dreams or just a hello — we read every message and usually reply within a couple of days.
          </p>
          <ul className="mt-8 space-y-3">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${c.bg} ${c.fg}`}>
                    <c.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink-soft">{c.label}</span>
                    <span className="block font-display text-lg font-semibold break-all">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center gap-4 rounded-3xl bg-sunny-soft p-5">
            <div className="w-20 shrink-0">
              <Nainu mood="happy" />
            </div>
            <p className="text-sm text-ink-soft">
              Looking for quick answers? Check our <Link href="/faq" className="font-bold text-pink-deep hover:underline">FAQ</Link>,{" "}
              <Link href="/shipping" className="font-bold text-pink-deep hover:underline">shipping</Link> and{" "}
              <Link href="/returns" className="font-bold text-pink-deep hover:underline">returns</Link> pages.
            </p>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
