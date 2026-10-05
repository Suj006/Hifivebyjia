import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/format";

interface LogoProps {
  className?: string;
  /** Rendered height in px. Width follows the logo's real aspect ratio. */
  height?: number;
  priority?: boolean;
  asLink?: boolean;
}

/**
 * Renders the official Hi 5 by Jia logo exactly as supplied (no recolouring,
 * cropping or effects). Until the file is added (see `siteConfig.logo`), a
 * plain text wordmark is shown — it is not a redraw of the logo.
 */
export function Logo({ className, height = 48, priority, asLink = true }: LogoProps) {
  const logo = siteConfig.logo;
  const content = logo ? (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      style={{ height, width: "auto" }}
      className="max-w-none"
    />
  ) : (
    <span className="font-display text-2xl leading-none font-bold text-ink sm:text-[1.7rem]">
      {siteConfig.name}
    </span>
  );

  if (!asLink) return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label={`${siteConfig.name} — home`}>
      {content}
    </Link>
  );
}
