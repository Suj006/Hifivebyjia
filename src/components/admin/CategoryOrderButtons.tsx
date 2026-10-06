"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { moveCategory } from "@/server/actions/categories";

export function CategoryOrderButtons({ slug, name, first, last }: { slug: string; name: string; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (direction: -1 | 1) =>
    start(async () => {
      await moveCategory(slug, direction);
      router.refresh();
    });
  const cls = "rounded-full p-2 text-ink-soft transition hover:bg-[#F3EDF5] hover:text-ink disabled:opacity-30";
  return (
    <div className="flex">
      <button type="button" className={cls} onClick={() => move(-1)} disabled={pending || first} aria-label={`Move ${name} up`}>
        <ArrowUp className="h-4 w-4" aria-hidden />
      </button>
      <button type="button" className={cls} onClick={() => move(1)} disabled={pending || last} aria-label={`Move ${name} down`}>
        <ArrowDown className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
