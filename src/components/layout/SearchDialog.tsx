"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { Nainu } from "@/components/brand/Nainu";
import { ProductImage } from "@/components/product/ProductImage";
import { microcopy } from "@/content/brand";
import { track } from "@/lib/analytics";
import { getCollections, getPublicProducts, isComingSoon, searchProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { setSearchOpen, useSearchOpen } from "@/store/ui";

const SUGGESTIONS = ["Bracelet", "Alphabet", "Keychain", "Gift", "Pastel"];

export function SearchDialog() {
  const open = useSearchOpen();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pool = useMemo(() => getPublicProducts(), []);
  const results = useMemo(() => (query.trim() ? searchProducts(pool, query).slice(0, 6) : []), [pool, query]);
  const collections = useMemo(() => getCollections().slice(0, 6), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const close = () => setSearchOpen(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    track("search", { search_term: q });
    close();
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={close} />
      <div className="relative mx-auto mt-0 flex max-h-[100dvh] w-full max-w-2xl animate-fade-up flex-col overflow-hidden bg-cream shadow-2xl sm:mt-20 sm:max-h-[80vh] sm:rounded-[2rem]">
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-line p-3 sm:p-4" role="search">
          <Search className="ml-2 h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search bracelets, keychains, gifts…"
            className="min-w-0 flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-ink-soft/70 focus-visible:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-full hover:bg-pink-soft" aria-label="Close search">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </form>

        <div className="overflow-y-auto p-4 sm:p-6">
          {!query.trim() && (
            <>
              <p className="text-sm font-bold tracking-wider text-ink-soft uppercase">Popular searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setQuery(s)} className="chip bg-white px-4 py-2 text-sm text-ink shadow-sm hover:bg-pink-soft">
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-sm font-bold tracking-wider text-ink-soft uppercase">Collections</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {collections.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categories/${c.slug}`} onClick={close} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 font-semibold shadow-sm hover:bg-pink-soft">
                      <span aria-hidden>{c.emoji}</span> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {query.trim() && results.length > 0 && (
            <ul className="space-y-2" aria-label="Search results">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.slug}`} onClick={close} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-sm transition hover:bg-pink-soft">
                    <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pink-soft/50">
                      <ProductImage image={p.images[0]} alt="" sizes="64px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-semibold">{p.name}</span>
                      <span className="block truncate text-sm text-ink-soft">{p.shortDescription}</span>
                    </span>
                    <span className="shrink-0 font-bold">{isComingSoon(p) ? "Soon ✨" : formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button type="submit" onClick={onSubmit} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-pink-deep hover:bg-pink-soft">
                  See all results for “{query.trim()}” <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </li>
            </ul>
          )}

          {query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center py-6 text-center" role="status">
              <div className="w-28">
                <Nainu mood="thinking" />
              </div>
              <p className="mt-3 font-display text-xl font-semibold">{microcopy.searchEmpty}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setQuery(s)} className="chip bg-white px-4 py-2 text-sm text-ink shadow-sm hover:bg-pink-soft">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
