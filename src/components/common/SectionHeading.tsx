import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, title, lead, align = "left", action, className, id }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 id={id} className={cn("section-title", eyebrow && "mt-4")}>
          {title}
        </h2>
        {lead && <p className={cn("section-lead", align === "center" && "mx-auto")}>{lead}</p>}
      </div>
      {action}
    </div>
  );
}
