import { Star } from "lucide-react";
import { cn } from "@/lib/format";

export function StarRating({ value, className, size = "h-4 w-4" }: { value: number; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(size, i <= Math.round(value) ? "fill-sunny text-sunny" : "fill-line text-line")}
        />
      ))}
    </span>
  );
}
