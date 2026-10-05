"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Nainu } from "@/components/brand/Nainu";
import { InstagramIcon } from "@/components/brand/SocialIcons";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/format";
import { useCartCount } from "@/store/cart";
import { useHydrated } from "@/store/records";
import { setSearchOpen } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      key={count}
      className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-pink-deep px-1 text-[11px] leading-none font-extrabold text-white ring-2 ring-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const iconBtn =
  "relative grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-pink-soft hover:text-pink-deep";

export function Header() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const cartCount = useCartCount();
  const wishlist = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          scrolled ? "border-line bg-white/95 shadow-sm backdrop-blur-md" : "border-transparent bg-white",
        )}
      >
        <div className="container-page flex h-[4.5rem] items-center gap-2 sm:h-24">
          <button
            ref={menuButtonRef}
            type="button"
            className={cn(iconBtn, "-ml-2 lg:hidden")}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>

          <Logo priority className="mr-auto h-16 sm:h-[5.25rem] lg:mr-0" sizes="(min-width: 640px) 84px, 64px" />

          <nav aria-label="Main" className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-4 py-2 font-display font-semibold transition hover:bg-pink-soft hover:text-pink-deep",
                      isActive(item.href) && "bg-pink-soft text-pink-deep",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button type="button" className={iconBtn} aria-label="Search products" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" aria-hidden />
            </button>
            <Link href="/wishlist" className={iconBtn} aria-label={`Wishlist${hydrated && wishlist.count ? `, ${wishlist.count} items` : ""}`}>
              <Heart className="h-5 w-5" aria-hidden />
              {hydrated && <CountBadge count={wishlist.count} />}
            </Link>
            <Link href="/cart" className={cn(iconBtn, "-mr-2 sm:mr-0")} aria-label={`Cart${hydrated && cartCount ? `, ${cartCount} items` : ""}`}>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {hydrated && <CountBadge count={cartCount} />}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn("fixed inset-0 z-[60] lg:hidden", menuOpen ? "visible" : "invisible")}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-cream shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line bg-white px-4 py-2">
            <Logo className="h-16" sizes="64px" />
            <button type="button" className={iconBtn} aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 px-4 py-6">
            <ul className="space-y-1">
              {[...mainNav, { label: "Creator Collaborations", href: "/creator-collaborations" }, { label: "Contact", href: "/contact" }].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-3 font-display text-xl font-semibold transition hover:bg-pink-soft",
                      isActive(item.href) && "bg-pink-soft text-pink-deep",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="m-4 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card">
            <div className="w-16 shrink-0">
              <Nainu mood="wave" />
            </div>
            <div className="text-sm">
              <p className="font-display text-base font-semibold">Hi from Nainu!</p>
              <a
                href={siteConfig.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={menuOpen ? 0 : -1}
                className="mt-1 inline-flex items-center gap-1.5 font-bold text-pink-deep"
              >
                <InstagramIcon className="h-4 w-4" /> Follow {siteConfig.social.instagram.handle}
              </a>
            </div>
          </div>
        </div>
      </div>

      <SearchDialog />
    </>
  );
}
