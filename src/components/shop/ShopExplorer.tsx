"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductGrid } from "@/components/product/ProductCard";
import { microcopy } from "@/content/brand";
import { track } from "@/lib/analytics";
import {
  AUDIENCE_LABELS,
  SORT_OPTIONS,
  filterProducts,
  priceBounds,
  productInCollection,
  shopProducts,
  type Availability,
  type ProductFilters,
  type SortOption,
} from "@/lib/catalog";
import { useStore } from "@/store/store-context";
import { cn, formatPrice, pluralise } from "@/lib/format";
import type { Audience } from "@/types";

const AUDIENCES: Audience[] = ["kids", "teens", "adults", "women", "families"];
const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: "in-stock", label: "In stock" },
  { value: "sold-out", label: "Sold out" },
];
const PRICE_BANDS = [
  { label: "Under ₹50", min: undefined, max: 49 },
  { label: "₹50 – ₹99", min: 50, max: 99 },
  { label: "₹100 – ₹199", min: 100, max: 199 },
  { label: "₹200 & above", min: 200, max: undefined },
];

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

function readFilters(sp: URLSearchParams): ProductFilters {
  return {
    q: sp.get("q") ?? undefined,
    category: list(sp.get("category")),
    audience: list(sp.get("audience")) as Audience[],
    collection: list(sp.get("collection")),
    availability: list(sp.get("availability")) as Availability[],
    minPrice: num(sp.get("min")),
    maxPrice: num(sp.get("max")),
    sort: (sp.get("sort") as SortOption) ?? "featured",
  };
}

interface ShopExplorerProps {
  /** Lock the explorer to a collection (used on /categories/[slug]). */
  fixedCollection?: string;
}

export function ShopExplorer({ fixedCollection }: ShopExplorerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlString = searchParams.toString();

  // Filters live in local state for instant feedback and are mirrored to the
  // URL (shareable, back-button friendly). External URL changes win.
  const [params, setParams] = useState(urlString);
  const [lastUrl, setLastUrl] = useState(urlString);
  if (urlString !== lastUrl) {
    setLastUrl(urlString);
    setParams(urlString);
  }
  const filters = useMemo(() => readFilters(new URLSearchParams(params)), [params]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState(filters.q ?? "");

  // Keep the input in sync when the URL query changes (e.g. header search).
  const [lastQ, setLastQ] = useState(filters.q);
  if (filters.q !== lastQ) {
    setLastQ(filters.q);
    setQuery(filters.q ?? "");
  }

  const shop = useStore();
  const ctx = useMemo(() => ({ collections: shop.collections, categories: shop.categories }), [shop.collections, shop.categories]);
  const pool = useMemo(() => {
    const all = shopProducts(shop.products);
    const fixed = fixedCollection ? shop.collections.find((c) => c.slug === fixedCollection) : undefined;
    return fixed ? all.filter((p) => productInCollection(p, fixed)) : all;
  }, [shop.products, shop.collections, fixedCollection]);
  const bounds = useMemo(() => priceBounds(pool), [pool]);
  // Only offer categories that have something to show (plus any already selected).
  const filterCategories = useMemo(
    () => shop.categories.filter((c) => pool.some((p) => p.category === c.slug) || filters.category?.includes(c.slug)),
    [shop.categories, pool, filters.category],
  );
  const soleCategory = filters.category?.length === 1 ? shop.categories.find((c) => c.slug === filters.category?.[0]) : undefined;
  const results = useMemo(() => filterProducts(pool, filters, ctx), [pool, filters, ctx]);

  // Debounced search-as-you-type.
  useEffect(() => {
    if ((filters.q ?? "") === query.trim()) return;
    const t = setTimeout(() => {
      update({ q: query.trim() || null });
      if (query.trim()) track("search", { search_term: query.trim() });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function update(changes: Record<string, string | null>) {
    const sp = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    setParams(qs);
    setLastUrl(qs);
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  function toggle(key: "category" | "audience" | "collection" | "availability", value: string) {
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: next.join(",") || null });
  }

  const priceBand = PRICE_BANDS.findIndex((b) => b.min === filters.minPrice && b.max === filters.maxPrice);
  const activeChips: { label: string; clear: () => void }[] = [
    ...(filters.category ?? []).map((c) => ({ label: shop.categories.find((x) => x.slug === c)?.name ?? c, clear: () => toggle("category", c) })),
    ...(filters.audience ?? []).map((a) => ({ label: AUDIENCE_LABELS[a] ?? a, clear: () => toggle("audience", a) })),
    ...(filters.collection ?? []).map((c) => ({ label: shop.collections.find((x) => x.slug === c)?.name ?? c, clear: () => toggle("collection", c) })),
    ...(filters.availability ?? []).map((a) => ({ label: AVAILABILITY.find((x) => x.value === a)?.label ?? a, clear: () => toggle("availability", a) })),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? [{ label: priceBand >= 0 ? PRICE_BANDS[priceBand].label : "Price", clear: () => update({ min: null, max: null }) }]
      : []),
  ];
  const clearAll = () => {
    setQuery("");
    setParams("");
    setLastUrl("");
    window.history.replaceState(null, "", pathname);
  };

  const filterPanel = (
    <div className="space-y-7">
      <FilterGroup title="Category">
        {filterCategories.map((c) => (
          <Check key={c.slug} label={c.name} checked={filters.category?.includes(c.slug) ?? false} onChange={() => toggle("category", c.slug)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Audience">
        {AUDIENCES.map((a) => (
          <Check key={a} label={AUDIENCE_LABELS[a]} checked={filters.audience?.includes(a) ?? false} onChange={() => toggle("audience", a)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {PRICE_BANDS.map((b, i) => (
          <label key={b.label} className="flex min-h-9 cursor-pointer items-center gap-3 text-ink">
            <input
              type="radio"
              name={`price-${fixedCollection ?? "all"}`}
              className="h-5 w-5 accent-pink-deep"
              checked={priceBand === i}
              onChange={() => update({ min: b.min?.toString() ?? null, max: b.max?.toString() ?? null })}
            />
            {b.label}
          </label>
        ))}
        <p className="text-xs text-ink-soft">
          Prices range from {formatPrice(bounds.min)} to {formatPrice(bounds.max)}
        </p>
      </FilterGroup>
      <FilterGroup title="Availability">
        {AVAILABILITY.map((a) => (
          <Check key={a.value} label={a.label} checked={filters.availability?.includes(a.value) ?? false} onChange={() => toggle("availability", a.value)} />
        ))}
      </FilterGroup>
      {!fixedCollection && (
        <FilterGroup title="Collection">
          {shop.collections.map((c) => (
            <Check key={c.slug} label={c.name} checked={filters.collection?.includes(c.slug) ?? false} onChange={() => toggle("collection", c.slug)} />
          ))}
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-3xl bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Filters</h2>
            {activeChips.length > 0 && (
              <button type="button" onClick={clearAll} className="text-sm font-bold text-pink-deep hover:underline">
                Clear all
              </button>
            )}
          </div>
          {filterPanel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden />
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <input
              id="shop-search"
              type="search"
              placeholder="Search name, colour, collection…"
              className="input pl-12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDrawerOpen(true)} className="btn btn-secondary flex-1 lg:hidden" aria-expanded={drawerOpen} aria-controls="filter-drawer">
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
              {activeChips.length > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-pink-deep px-1.5 text-xs text-white">{activeChips.length}</span>}
            </button>
            <label htmlFor="shop-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="shop-sort"
              className="input w-auto flex-1 pr-10 font-semibold sm:flex-none"
              value={filters.sort ?? "featured"}
              onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm font-semibold text-ink-soft" aria-live="polite">
            {pluralise(results.length, "product")}
            {filters.q ? ` for “${filters.q}”` : ""}
          </p>
          {activeChips.map((c) => (
            <button key={c.label} type="button" onClick={c.clear} className="chip bg-pink-soft px-3 py-1.5 text-sm text-pink-deep hover:bg-pink hover:text-white">
              {c.label} <X className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
        </div>
        {soleCategory?.description && <p className="mt-2 text-ink-soft">{soleCategory.description}</p>}

        <div className="mt-6">
          {results.length > 0 ? (
            <ProductGrid products={results} categories={shop.categories} ratings={shop.ratings} priorityCount={4} />
          ) : (
            <EmptyState
              mood="thinking"
              title={filters.q ? microcopy.searchEmpty : "No matches for those filters"}
              text={filters.q ? "Check the spelling, try a simpler word like “bracelet”, or browse all products." : "Try removing a filter or two."}
            >
              <button type="button" onClick={clearAll} className="btn btn-primary mt-6">
                Show all products
              </button>
            </EmptyState>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div id="filter-drawer" className={cn("fixed inset-0 z-[60] lg:hidden", drawerOpen ? "visible" : "invisible")} aria-hidden={!drawerOpen}>
        <div className={cn("absolute inset-0 bg-ink/40 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")} onClick={() => setDrawerOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[2rem] bg-cream shadow-2xl transition-transform duration-300",
            drawerOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-xl font-bold">Filters</h2>
            <button type="button" onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-pink-soft" aria-label="Close filters">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-6">{filterPanel}</div>
          <div className="flex gap-3 border-t border-line p-4">
            <button type="button" onClick={clearAll} className="btn btn-secondary flex-1">
              Clear all
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-[2]">
              Show {pluralise(results.length, "product")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-display text-base font-bold">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3 text-ink">
      <input type="checkbox" className="h-5 w-5 rounded accent-pink-deep" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
