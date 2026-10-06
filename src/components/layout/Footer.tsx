import Link from "next/link";
import { Heart } from "@/components/brand/Heart";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BeadString } from "@/components/brand/Decor";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/SocialIcons";
import { footerNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { isWhatsAppConfigured, whatsappLink } from "@/lib/whatsapp";
import type { StoreSettings } from "@/types";

export function Footer({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  const wa = isWhatsAppConfigured(settings.whatsappNumber) ? settings.whatsappNumber : "";
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      <div className="absolute inset-x-0 top-0 h-2 bg-linear-to-r from-pink via-sunny to-sky" aria-hidden />
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <div className="inline-block rounded-[2rem] bg-white p-2 shadow-soft">
            <Logo className="h-32 sm:h-36" sizes="144px" />
          </div>
          <p className="mt-5 max-w-sm font-display text-xl text-white/90">{siteConfig.footerTagline}</p>
          <BeadString className="mt-6 w-56" />
          <ul className="mt-6 space-y-3 text-white/80">
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 hover:text-sunny">
                <Mail className="h-5 w-5" aria-hidden /> {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a href={siteConfig.social.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-sunny">
                <InstagramIcon /> Instagram {siteConfig.social.instagram.handle}
              </a>
            </li>
            {wa && (
              <li>
                <a href={whatsappLink(wa, `Hello ${siteConfig.name}! ✋`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-sunny">
                  <WhatsAppIcon /> WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-display text-lg font-semibold text-sunny">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/80 transition hover:text-white hover:underline hover:underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {siteConfig.name}. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">Handmade with <Heart className="h-4 w-4" label="love" /> in India</p>
        </div>
      </div>
    </footer>
  );
}
