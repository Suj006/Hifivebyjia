import type { Metadata } from "next";
import { ReviewModeration } from "@/components/reviews/ReviewModeration";

export const metadata: Metadata = {
  title: "Review moderation (preview)",
  robots: { index: false, follow: false },
};

export default function ReviewModerationPage() {
  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Review moderation</h1>
      <div className="mt-4 rounded-2xl bg-sunny-soft p-4 text-sm text-ink">
        <p className="font-bold">Phase 1 preview — this page only manages reviews stored in this browser.</p>
        <p className="mt-1 text-ink-soft">
          Real submissions arrive through the forms webhook. To publish a review for everyone, add it to <code>src/data/reviews.ts</code> with{" "}
          <code>status: &quot;approved&quot;</code>. Phase 2 replaces this page with a secure admin dashboard.
        </p>
      </div>
      <div className="mt-8">
        <ReviewModeration />
      </div>
    </div>
  );
}
