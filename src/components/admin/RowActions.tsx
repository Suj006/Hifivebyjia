"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { cn } from "@/lib/format";

export interface RowAction {
  label: ReactNode;
  run: () => Promise<unknown>;
  confirm?: string;
  tone?: "primary" | "danger" | "plain";
  ariaLabel?: string;
}

/** A row of buttons that call server actions and refresh the page. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          disabled={pending}
          aria-label={a.ariaLabel}
          onClick={() =>
            start(async () => {
              if (a.confirm && !confirm(a.confirm)) return;
              await a.run();
              router.refresh();
            })
          }
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition disabled:opacity-50",
            a.tone === "primary" && "bg-mint-soft text-mint-deep hover:bg-mint/30",
            a.tone === "danger" && "text-pink-deep hover:bg-pink-soft",
            (!a.tone || a.tone === "plain") && "bg-[#F3EDF5] text-ink hover:bg-pink-soft",
          )}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
