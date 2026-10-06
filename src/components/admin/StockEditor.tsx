"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateStock } from "@/server/actions/products";
import { cn } from "@/lib/format";

/** Inline stock editor on the product list. */
export function StockEditor({ id, stock }: { id: string; stock: number }) {
  const [value, setValue] = useState(String(stock));
  const [saved, setSaved] = useState(String(stock));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const dirty = value !== saved;

  const save = () =>
    start(async () => {
      const res = await updateStock(id, Number(value));
      if (res.ok) {
        setSaved(value);
        setError("");
      } else setError(res.error ?? "Couldn’t save");
    });

  return (
    <div className="flex items-center gap-1">
      <label className="text-xs font-bold text-ink-soft" htmlFor={`stock-${id}`}>
        Stock
      </label>
      <input
        id={`stock-${id}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && dirty && save()}
        className={cn("w-16 rounded-xl border-2 px-2 py-1.5 text-center font-bold", Number(saved) <= 3 ? "border-sunny" : "border-line", error && "border-pink-deep")}
        aria-invalid={Boolean(error)}
        title={error || undefined}
      />
      {dirty && (
        <button type="button" onClick={save} disabled={pending} className="grid h-8 w-8 place-items-center rounded-full bg-mint text-ink" aria-label="Save stock">
          <Check className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
