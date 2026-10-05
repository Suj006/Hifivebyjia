import { cn } from "@/lib/format";

/** Small decorative shapes inspired by the brand palette. All aria-hidden. */

export function Sparkle({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("pointer-events-none", className)} aria-hidden="true">
      <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4Z" fill={color} />
    </svg>
  );
}

export function Squiggle({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 24" preserveAspectRatio="none" className={cn("pointer-events-none", className)} aria-hidden="true" fill="none">
      <path d="M2 12 C12 2 22 2 32 12 S52 22 62 12 82 2 92 12 112 22 118 12" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Blob({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("pointer-events-none", className)} aria-hidden="true">
      <path
        d="M45.7,-58.6C58.4,-47.8,67.2,-32.6,70.9,-16.1C74.6,0.4,73.2,18.2,65.1,32.4C57,46.6,42.3,57.2,26.1,63.8C9.9,70.4,-7.8,73,-24.4,68.4C-41,63.8,-56.4,52,-65.4,36.4C-74.4,20.8,-77,1.4,-72.6,-16C-68.2,-33.4,-56.8,-48.8,-42.4,-59.5C-28,-70.2,-14,-76.2,1.3,-77.8C16.6,-79.4,33,-69.4,45.7,-58.6Z"
        transform="translate(100 100)"
        fill={color}
      />
    </svg>
  );
}

export function BeadString({ className }: { className?: string }) {
  const colors = ["#FF4F9A", "#FFC93C", "#36C5F0", "#7B5CFF", "#2ED3A2", "#FF8A3D"];
  return (
    <svg viewBox="0 0 260 30" className={cn("pointer-events-none", className)} aria-hidden="true">
      <path d="M4 15 Q130 30 256 15" stroke="#E9DDF0" strokeWidth="2" fill="none" />
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 12 + i * 21.5;
        const y = 15 + Math.sin((i / 11) * Math.PI) * 7;
        return <circle key={i} cx={x} cy={y} r={8} fill={colors[i % colors.length]} />;
      })}
    </svg>
  );
}

export function HighFiveHand({ className }: { className?: string }) {
  return <span className={cn("inline-block origin-[70%_80%] animate-wave", className)} aria-hidden="true">✋</span>;
}
