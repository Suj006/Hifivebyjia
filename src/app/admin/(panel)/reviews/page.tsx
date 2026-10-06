import type { Metadata } from "next";
import Link from "next/link";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { EmptyNote, PageHeader, Pill } from "@/components/admin/ui";
import { StarRating } from "@/components/common/StarRating";
import { cn, formatDateTime } from "@/lib/format";
import { listProducts, listReviews } from "@/server/admin-data";

export const metadata: Metadata = { title: "Reviews" };

const TABS = [
  { value: "pending", label: "Waiting for approval" },
  { value: "approved", label: "Approved (public)" },
  { value: "rejected", label: "Rejected" },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const [reviews, products] = await Promise.all([listReviews(status), listProducts()]);
  const names = new Map(products.map((p) => [p.id, p]));
  return (
    <>
      <PageHeader title="Reviews" description="Customer reviews are only shown on the website after you approve them." />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Review status">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/reviews?status=${t.value}`}
            aria-current={status === t.value ? "page" : undefined}
            className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold", status === t.value ? "border-pink-deep bg-pink-soft text-pink-deep" : "border-line bg-white hover:border-pink")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {reviews.length ? (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const product = names.get(r.productId);
            return (
              <li key={r.id} className="rounded-3xl border border-line bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating value={r.rating} />
                  <span className="font-bold">{r.name}</span>
                  <span className="text-sm text-ink-soft">· {formatDateTime(r.createdAt)}</span>
                  {r.featured && <Pill tone="yellow">Featured</Pill>}
                </div>
                <p className="mt-1 text-sm">
                  on{" "}
                  {product ? (
                    <a href={`/products/${product.slug}#reviews`} target="_blank" rel="noopener noreferrer" className="font-bold text-pink-deep hover:underline">
                      {product.name}
                    </a>
                  ) : (
                    <span className="text-ink-soft">a deleted product</span>
                  )}
                </p>
                {r.title && <p className="mt-2 font-display text-lg font-semibold">{r.title}</p>}
                <p className="mt-1 whitespace-pre-line text-ink-soft">{r.text}</p>
                <div className="mt-4">
                  <ReviewActions id={r.id} status={r.status} featured={Boolean(r.featured)} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote>{status === "pending" ? "No reviews waiting — you’re all caught up! 🎉" : "Nothing here yet."}</EmptyNote>
      )}
    </>
  );
}
