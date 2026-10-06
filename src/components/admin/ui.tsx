import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/format";

/** Small building blocks shared by admin pages. */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-ink-soft hover:text-pink-deep">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, className, actions }: { title?: string; description?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="font-display text-xl font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const PILL: Record<string, string> = {
  green: "bg-mint-soft text-mint-deep",
  pink: "bg-pink-soft text-pink-deep",
  yellow: "bg-sunny-soft text-sunny-deep",
  purple: "bg-grape-soft text-grape-deep",
  blue: "bg-sky-soft text-sky-deep",
  grey: "bg-[#EFEAF1] text-ink-soft",
};

export function Pill({ tone = "grey", children }: { tone?: keyof typeof PILL; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap", PILL[tone])}>{children}</span>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-ink-soft">{children}</p>;
}

export function StatCard({ label, value, href, tone = "pink" }: { label: string; value: ReactNode; href?: string; tone?: "pink" | "blue" | "yellow" | "purple" | "green" }) {
  const tones = {
    pink: "from-pink-soft",
    blue: "from-sky-soft",
    yellow: "from-sunny-soft",
    purple: "from-grape-soft",
    green: "from-mint-soft",
  };
  const body = (
    <div className={cn("h-full rounded-3xl border border-line bg-linear-to-br to-white p-5 shadow-sm transition", tones[tone], href && "hover:-translate-y-0.5 hover:shadow-soft")}>
      <p className="text-sm font-bold text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function FieldLabel({ htmlFor, children, hint, optional }: { htmlFor: string; children: ReactNode; hint?: ReactNode; optional?: boolean }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {children}
        {optional && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Toggle({ id, label, checked, onChange, hint }: { id: string; label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-3 hover:border-pink">
      <input id={id} type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-pink-deep" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
    </label>
  );
}
