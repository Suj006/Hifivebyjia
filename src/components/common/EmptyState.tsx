import Link from "next/link";
import type { ReactNode } from "react";
import { Nainu, type NainuMood } from "@/components/brand/Nainu";
import { cn } from "@/lib/format";

interface EmptyStateProps {
  title: string;
  text?: string;
  mood?: NainuMood;
  action?: { label: string; href: string };
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ title, text, mood = "happy", action, children, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[2rem] bg-white/70 text-center",
        compact ? "px-6 py-8" : "px-6 py-12 sm:py-16",
        className,
      )}
    >
      <div className={cn("animate-bounce-in", compact ? "w-28" : "w-40 sm:w-48")}>
        <Nainu mood={mood} />
      </div>
      <h2 className={cn("mt-4 font-display font-bold text-ink", compact ? "text-xl" : "text-2xl sm:text-3xl")}>{title}</h2>
      {text && <p className="mt-2 max-w-md text-ink-soft">{text}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
