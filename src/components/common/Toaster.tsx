"use client";

import Link from "next/link";
import { CheckCircle2, Info, X } from "lucide-react";
import { dismissToast, useToasts } from "@/store/ui";
import { cn } from "@/lib/format";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:right-6 sm:bottom-6 sm:left-auto sm:items-end"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm animate-bounce-in items-start gap-3 rounded-2xl border bg-white p-4 shadow-soft",
            t.tone === "error" ? "border-pink" : "border-line",
          )}
        >
          {t.tone === "info" || t.tone === "error" ? (
            <Info className={cn("mt-0.5 h-5 w-5 shrink-0", t.tone === "error" ? "text-pink-deep" : "text-grape")} aria-hidden />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-deep" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{t.title}</p>
            {t.description && <p className="mt-0.5 text-sm text-ink-soft">{t.description}</p>}
            {t.action && (
              <Link href={t.action.href} className="mt-2 inline-block text-sm font-bold text-pink-deep underline-offset-2 hover:underline" onClick={() => dismissToast(t.id)}>
                {t.action.label} →
              </Link>
            )}
          </div>
          <button type="button" onClick={() => dismissToast(t.id)} className="rounded-full p-1 text-ink-soft hover:bg-pink-soft" aria-label="Dismiss notification">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
