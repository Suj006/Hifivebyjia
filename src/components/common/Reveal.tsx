import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/format";

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Fades content up as it scrolls into view using CSS scroll-driven animations
 * (no JavaScript). Browsers without support — and visitors who prefer reduced
 * motion — simply see the content without animation.
 */
export function Reveal({ children, className, as: Tag = "div" }: RevealProps) {
  return <Tag className={cn("reveal", className)}>{children}</Tag>;
}
