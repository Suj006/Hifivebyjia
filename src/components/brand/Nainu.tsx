import { useId } from "react";
import { cn } from "@/lib/format";

/**
 * Nainu — the Hi 5 by Jia brand mascot.
 *
 * A clearly stylised, fictional cartoon character (not a portrait). If a
 * reference image of the official character is supplied later, replace this
 * illustration while keeping the same `mood` API.
 */
export type NainuMood = "wave" | "happy" | "thinking" | "oops" | "celebrate";

interface NainuProps {
  mood?: NainuMood;
  className?: string;
  /** Decorative by default; pass a label to expose it to screen readers. */
  label?: string;
  animated?: boolean;
}

const SKIN = "#F2C29D";
const SKIN_SHADE = "#E3A981";
const HAIR = "#3B2340";
const HAIR_LIGHT = "#5A3760";
const SHIRT = "#ED0C68";
const SHIRT_SHADE = "#C70A58";

function HandShape({ x, y, rotate = 0, open = true }: { x: number; y: number; rotate?: number; open?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {open ? (
        <>
          <rect x={-15} y={-34} width={7} height={22} rx={3.5} fill={SKIN} />
          <rect x={-7} y={-38} width={7} height={26} rx={3.5} fill={SKIN} />
          <rect x={1} y={-37} width={7} height={25} rx={3.5} fill={SKIN} />
          <rect x={9} y={-31} width={6.5} height={20} rx={3.25} fill={SKIN} />
          <rect x={10} y={-12} width={7} height={18} rx={3.5} fill={SKIN} transform="rotate(-50 13 -4)" />
        </>
      ) : null}
      <rect x={-15} y={-16} width={30} height={26} rx={12} fill={SKIN} />
    </g>
  );
}

function Bracelet({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  const colors = ["#FAAF04", "#01BDC6", "#7721C2", "#2ED3A2", "#FFFFFF"];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {colors.map((c, i) => (
        <circle key={i} cx={-12 + i * 6} cy={0} r={3.6} fill={c} stroke="#ffffff" strokeWidth={0.6} />
      ))}
    </g>
  );
}

export function Nainu({ mood = "wave", className, label, animated = true }: NainuProps) {
  const uid = useId().replace(/:/g, "");
  const raisedRight = mood === "wave" || mood === "celebrate";
  const raisedLeft = mood === "celebrate";

  return (
    <svg
      viewBox="0 0 240 280"
      className={cn("h-auto w-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={`cheek-${uid}`}>
          <stop offset="0" stopColor="#FF7FB2" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FF7FB2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SHIRT} />
          <stop offset="1" stopColor={SHIRT_SHADE} />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="120" cy="272" rx="70" ry="7" fill="#3B1F4C" opacity="0.08" />

      {/* hair back */}
      <path d="M58 118 C52 70 88 44 120 44 C152 44 188 70 182 118 C186 150 178 176 168 190 L72 190 C62 176 54 150 58 118Z" fill={HAIR} />

      {/* buns */}
      <circle cx="70" cy="58" r="24" fill={HAIR} />
      <circle cx="170" cy="58" r="24" fill={HAIR} />
      <circle cx="64" cy="52" r="8" fill={HAIR_LIGHT} opacity="0.6" />
      <circle cx="164" cy="52" r="8" fill={HAIR_LIGHT} opacity="0.6" />
      <path d="M84 74 q8 -8 16 -4" stroke="#FAAF04" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M156 74 q-8 -8 -16 -4" stroke="#01BDC6" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* body */}
      <path d="M78 196 C78 184 96 178 120 178 C144 178 162 184 162 196 L170 262 C170 268 166 272 160 272 L80 272 C74 272 70 268 70 262Z" fill={`url(#shirt-${uid})`} />
      <rect x="110" y="166" width="20" height="18" rx="6" fill={SKIN_SHADE} />
      <path d="M104 182 q16 12 32 0" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* "5" star badge on shirt */}
      <g transform="translate(120 226)">
        <path d="M0 -15 L4.4 -5 L15 -4.6 L6.8 2.4 L9.4 13 L0 7 L-9.4 13 L-6.8 2.4 L-15 -4.6 L-4.4 -5Z" fill="#FAAF04" />
        <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3B1F4C" fontFamily="system-ui, sans-serif">5</text>
      </g>

      {/* left arm (viewer's left) */}
      {raisedLeft ? (
        <g className={animated ? "origin-[80px_196px] animate-wave [animation-delay:-1.2s]" : undefined}>
          <path d="M82 198 C68 186 56 160 52 136" stroke={SHIRT} strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M56 160 C54 150 52 142 52 136" stroke={SKIN} strokeWidth="14" strokeLinecap="round" fill="none" />
          <HandShape x={50} y={124} rotate={-14} />
        </g>
      ) : (
        <g>
          <path d="M80 200 C70 216 66 234 68 250" stroke={SHIRT} strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M68 238 C67 244 67 248 68 252" stroke={SKIN} strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="68" cy="256" r="10" fill={SKIN} />
        </g>
      )}

      {/* right arm (viewer's right) */}
      {raisedRight ? (
        <g className={animated ? "origin-[160px_198px] animate-wave" : undefined}>
          <path d="M158 198 C172 186 184 160 188 136" stroke={SHIRT} strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M184 160 C186 150 188 142 188 136" stroke={SKIN} strokeWidth="14" strokeLinecap="round" fill="none" />
          <Bracelet x={186} y={146} rotate={-80} />
          <HandShape x={190} y={124} rotate={14} />
        </g>
      ) : mood === "thinking" ? (
        <g>
          <path d="M160 200 C176 210 172 186 150 168" stroke={SHIRT} strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="146" cy="160" r="11" fill={SKIN} />
        </g>
      ) : (
        <g>
          <path d="M160 200 C170 216 174 234 172 250" stroke={SHIRT} strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M172 238 C173 244 173 248 172 252" stroke={SKIN} strokeWidth="14" strokeLinecap="round" fill="none" />
          <Bracelet x={172} y={240} rotate={0} />
          <circle cx="172" cy="256" r="10" fill={SKIN} />
        </g>
      )}

      {/* head */}
      <ellipse cx="70" cy="122" rx="9" ry="12" fill={SKIN_SHADE} />
      <ellipse cx="170" cy="122" rx="9" ry="12" fill={SKIN_SHADE} />
      <circle cx="120" cy="118" r="54" fill={SKIN} />

      {/* bangs */}
      <path d="M66 112 C66 76 92 60 120 60 C150 60 176 78 174 112 C160 100 150 86 146 76 C138 92 116 100 96 98 C88 104 78 108 66 112Z" fill={HAIR} />
      <path d="M100 72 C112 66 130 66 140 72" stroke={HAIR_LIGHT} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* cheeks */}
      <circle cx="90" cy="136" r="13" fill={`url(#cheek-${uid})`} />
      <circle cx="150" cy="136" r="13" fill={`url(#cheek-${uid})`} />

      {/* eyes & brows by mood */}
      {mood === "oops" ? (
        <>
          <path d="M92 104 q8 -6 16 0" stroke={HAIR} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M132 104 q8 -6 16 0" stroke={HAIR} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="100" cy="120" r="7" fill="#3B1F4C" />
          <circle cx="140" cy="120" r="7" fill="#3B1F4C" />
          <circle cx="102.5" cy="117.5" r="2.4" fill="#fff" />
          <circle cx="142.5" cy="117.5" r="2.4" fill="#fff" />
          <ellipse cx="120" cy="146" rx="6" ry="7" fill="#8A2A4F" />
          <path d="M168 92 q6 10 0 14 q-6 -4 0 -14z" fill="#7FDBFF" />
        </>
      ) : mood === "celebrate" ? (
        <>
          <path d="M92 122 q8 -10 16 0" stroke="#3B1F4C" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M132 122 q8 -10 16 0" stroke="#3B1F4C" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M104 138 q16 22 32 0 z" fill="#8A2A4F" />
          <path d="M110 144 q10 8 20 0" fill="#FF8FB8" />
        </>
      ) : (
        <>
          <ellipse cx="100" cy="122" rx="7" ry="8.5" fill="#3B1F4C" />
          <ellipse cx="140" cy="122" rx="7" ry="8.5" fill="#3B1F4C" />
          <circle cx={mood === "thinking" ? 102 : 102.5} cy={mood === "thinking" ? 117 : 118.5} r="2.6" fill="#fff" />
          <circle cx={mood === "thinking" ? 142 : 142.5} cy={mood === "thinking" ? 117 : 118.5} r="2.6" fill="#fff" />
          <path d="M92 108 q8 -5 15 -1" stroke={HAIR} strokeWidth="3" strokeLinecap="round" fill="none" opacity={mood === "thinking" ? 1 : 0} />
          {mood === "thinking" ? (
            <path d="M112 146 q8 -4 16 0" stroke="#8A2A4F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M106 140 q14 14 28 0" stroke="#8A2A4F" strokeWidth="4" strokeLinecap="round" fill="none" />
          )}
        </>
      )}

      {/* extras */}
      {mood === "thinking" && (
        <g className={animated ? "animate-float" : undefined}>
          <circle cx="196" cy="70" r="20" fill="#FFFFFF" stroke="#F1E7FB" strokeWidth="3" />
          <circle cx="178" cy="96" r="5" fill="#FFFFFF" stroke="#F1E7FB" strokeWidth="2" />
          <text x="196" y="78" textAnchor="middle" fontSize="24" fontWeight="800" fill="#7721C2" fontFamily="system-ui, sans-serif">?</text>
        </g>
      )}
      {mood === "celebrate" && (
        <g>
          {[
            [28, 90, "#FAAF04"],
            [214, 84, "#01BDC6"],
            [40, 30, "#7721C2"],
            [206, 24, "#2ED3A2"],
          ].map(([x, y, c], i) => (
            <path
              key={i}
              d={`M${x} ${Number(y) - 9} l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z`}
              fill={String(c)}
              className={animated ? "origin-center animate-sparkle [transform-box:fill-box]" : undefined}
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
