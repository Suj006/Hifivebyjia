import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/format";

interface LogoProps {
  /** Sizing classes for the logo box, e.g. "h-14 sm:h-20". Width follows the logo's aspect ratio. */
  className?: string;
  /** Hint for responsive image loading (CSS width the logo renders at). */
  sizes?: string;
  priority?: boolean;
  asLink?: boolean;
}

/**
 * Renders the official Hi 5 by Jia logo exactly as supplied: no recolouring,
 * cropping, filters or effects — it is only scaled. If `siteConfig.logo` is
 * cleared, a plain text wordmark is shown instead (never a redraw).
 */
export function Logo({ className = "h-12", sizes = "96px", priority, asLink = true }: LogoProps) {
  const logo = siteConfig.logo;
  const content = logo ? (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      quality={90}
      sizes={sizes}
      className="h-full w-auto max-w-none"
    />
  ) : (
    <span className="font-display text-2xl leading-none font-bold text-ink sm:text-[1.7rem]">{siteConfig.name}</span>
  );

  if (!asLink) return <span className={cn("inline-flex shrink-0 items-center", className)}>{content}</span>;
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label={`${siteConfig.name} — home`}>
      {content}
    </Link>
  );
}
