import { useId } from "react";
import { cn } from "@/lib/format";

/**
 * Brand heart motif, inspired by the hearts in the Hi Five by Jia logo
 * (a complementary element — the logo itself is never redrawn).
 *
 * - `face` adds the logo-inspired winking smile; keep it for a few special
 *   moments (headings, empty states), not every icon.
 * - Decorative by default (aria-hidden). Pass `label` to announce it.
 */
const HEART_PATH =
  "M12 21.3s-8.6-5.2-10.7-10.2C-.4 6.9 2.4 2.2 6.7 2.2c2.3 0 4.1 1.3 5.3 3.1 1.2-1.8 3-3.1 5.3-3.1 4.3 0 7.1 4.7 5.4 8.9-2.1 5-10.7 10.2-10.7 10.2Z";

interface HeartProps {
  className?: string;
  color?: string;
  face?: boolean;
  outline?: boolean;
  label?: string;
}

export function Heart({ className, color = "#ED0C68", face, outline, label }: HeartProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 24 23"
      className={cn("inline-block shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {outline ? (
        <path d={HEART_PATH} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      ) : (
        <>
          <defs>
            <radialGradient id={`h-${id}`} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={HEART_PATH} fill={color} />
          <path d={HEART_PATH} fill={`url(#h-${id})`} />
        </>
      )}
      {face && !outline && (
        <g>
          <circle cx="8.4" cy="10.2" r="1.15" fill="#3B1F4C" />
          <circle cx="8.8" cy="9.8" r="0.35" fill="#FFFFFF" />
          <path d="M14.4 10.3q1.2-1.1 2.4 0" stroke="#3B1F4C" strokeWidth="0.9" strokeLinecap="round" fill="none" />
          <path d="M10.2 13.1q1.8 1.6 3.6 0" stroke="#3B1F4C" strokeWidth="0.9" strokeLinecap="round" fill="none" />
          <ellipse cx="6.6" cy="12.6" rx="1.3" ry="0.8" fill="#FF8FB8" opacity="0.8" />
          <ellipse cx="17.4" cy="12.6" rx="1.3" ry="0.8" fill="#FF8FB8" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

/** A soft line with an outlined heart in the middle — echoes the swash after "by Jia" in the logo. */
export function HeartLine({ className, color = "#7721C2" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 160 28" className={cn("pointer-events-none", className)} aria-hidden="true" fill="none">
      <path d="M2 16 C24 12 44 18 64 14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M96 14 C116 18 136 12 158 16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <g transform="translate(69 3) scale(0.92)">
        <path d={HEART_PATH} stroke="#ED0C68" strokeWidth="2.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A few floating hearts for decorative moments (hero, celebrations). */
export function FloatingHearts({ className }: { className?: string }) {
  const hearts = [
    { left: "8%", top: "12%", size: "h-4 w-4", color: "#ED0C68", delay: "0s" },
    { left: "88%", top: "20%", size: "h-3 w-3", color: "#7721C2", delay: "-2s" },
    { left: "78%", top: "78%", size: "h-5 w-5", color: "#FAAF04", delay: "-4s" },
    { left: "14%", top: "82%", size: "h-3 w-3", color: "#01BDC6", delay: "-1s" },
  ];
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden="true">
      {hearts.map((h, i) => (
        <span key={i} className="absolute animate-float" style={{ left: h.left, top: h.top, animationDelay: h.delay }}>
          <Heart className={h.size} color={h.color} />
        </span>
      ))}
    </div>
  );
}
