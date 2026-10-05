/**
 * Generates placeholder product illustrations (SVG) for Phase 1.
 *
 * Every image is clearly marked "Illustration" so customers know it is not a
 * photo. Replace files in `public/products/<slug>/` with real photos
 * (and update `src/data/products.ts`) whenever they are ready.
 *
 * Usage: node scripts/generate-product-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "products");
const S = 1200;

const BG = {
  pink: ["#FFE1EE", "#FFD0E6"],
  sunny: ["#FFF3D6", "#FFE6A3"],
  sky: ["#DBF6F7", "#C2EBFF"],
  grape: ["#F1E7FB", "#DCD3FF"],
  mint: ["#DDF8EF", "#C3F0E1"],
  peach: ["#FFE9DC", "#FFD6BF"],
  cream: ["#FFF8EE", "#FBEAD4"],
};

// deterministic pseudo random
function rng(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const defs = (bg, id) => `
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/>
    </linearGradient>
    <radialGradient id="shine-${id}" cx="0.35" cy="0.3" r="0.7">
      <stop offset="0" stop-color="#fff" stop-opacity="0.85"/>
      <stop offset="0.35" stop-color="#fff" stop-opacity="0.15"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.12"/>
    </radialGradient>
    <filter id="shadow-${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#3B1F4C" flood-opacity="0.18"/>
    </filter>
  </defs>`;

const confetti = (rand, palette, count = 18) => {
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const c = palette[Math.floor(rand() * palette.length)];
    const r = 6 + rand() * 12;
    const shape = rand();
    if (shape < 0.4) out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.45"/>`;
    else if (shape < 0.7)
      out += `<rect x="${x}" y="${y}" width="${r * 2}" height="${r * 0.8}" rx="${r * 0.4}" fill="${c}" opacity="0.4" transform="rotate(${rand() * 180} ${x} ${y})"/>`;
    else
      out += `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z" fill="${c}" opacity="0.5"/>`;
  }
  return out;
};

const bead = (id, x, y, r, color, letter) => {
  let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#shine-${id})"/>`;
  if (letter) {
    s = `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.35}" fill="#FFFFFF" stroke="#E9DDF5" stroke-width="${r * 0.06}"/>
      <rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.35}" fill="url(#shine-${id})" opacity="0.5"/>
      <text x="${x}" y="${y + r * 0.38}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700" font-size="${r * 1.1}" fill="${color}">${letter}</text>`;
  }
  return s;
};

/** Ring of beads. opts: colors[], beadR, ringR, cx, cy, letters (string), tilt (y scale), special (indexes larger) */
function braceletRing(id, opts) {
  const { cx = S / 2, cy = S / 2, ringR = 300, beadR = 42, colors, letters = "", tilt = 1, rotation = 0, charm } = opts;
  const n = Math.max(12, Math.round((2 * Math.PI * ringR) / (beadR * 2.05)));
  const items = [];
  const letterStart = Math.floor(n * 0.75) - Math.floor(letters.length / 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rotation * Math.PI) / 180;
    const x = cx + Math.cos(a) * ringR;
    const y = cy + Math.sin(a) * ringR * tilt;
    const li = i - letterStart;
    const letter = letters && li >= 0 && li < letters.length ? letters[li] : undefined;
    const r = letter ? beadR * 1.08 : beadR * (opts.sizes ? opts.sizes[i % opts.sizes.length] : 1);
    items.push({ y, svg: bead(id, x, y, r, colors[i % colors.length], letter) });
  }
  // elastic string
  let s = `<ellipse cx="${cx}" cy="${cy}" rx="${ringR}" ry="${ringR * tilt}" fill="none" stroke="#F3E6F7" stroke-width="6"/>`;
  items.sort((a, b) => a.y - b.y);
  s += items.map((i) => i.svg).join("");
  if (charm) s += charm;
  return `<g filter="url(#shadow-${id})">${s}</g>`;
}

const label = (text) => `
  <g>
    <rect x="${S - 330}" y="${S - 92}" width="290" height="56" rx="28" fill="#FFFFFF" opacity="0.85"/>
    <text x="${S - 185}" y="${S - 55}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#6E5A7E" letter-spacing="1">${text}</text>
  </g>`;

const kindTag = (text) => `
  <g>
    <rect x="40" y="40" width="${text.length * 17 + 56}" height="56" rx="28" fill="#3B1F4C" opacity="0.85"/>
    <text x="68" y="77" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">${text}</text>
  </g>`;

const wrap = (id, bg, body, kind) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img">
${defs(bg, id)}
<rect width="${S}" height="${S}" fill="url(#bg-${id})"/>
${body}
${kind ? kindTag(kind) : ""}
${label("ILLUSTRATION")}
</svg>`;

function pouch(id, colors, text = "Hi 5") {
  return `<g filter="url(#shadow-${id})">
    <path d="M360 470 Q600 400 840 470 L880 900 Q600 960 320 900 Z" fill="${colors[0]}"/>
    <path d="M360 470 Q600 400 840 470 L850 540 Q600 480 350 540 Z" fill="${colors[1]}" opacity="0.8"/>
    <path d="M420 455 Q460 330 520 420" fill="none" stroke="${colors[2]}" stroke-width="14" stroke-linecap="round"/>
    <path d="M780 455 Q740 330 680 420" fill="none" stroke="${colors[2]}" stroke-width="14" stroke-linecap="round"/>
    <rect x="500" y="640" width="200" height="120" rx="24" fill="#FFFFFF"/>
    <text x="600" y="718" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="54" font-weight="700" fill="${colors[2]}">${text}</text>
  </g>`;
}

function giftBox(id, colors) {
  return `<g filter="url(#shadow-${id})">
    <rect x="330" y="520" width="540" height="400" rx="36" fill="${colors[0]}"/>
    <rect x="300" y="440" width="600" height="130" rx="30" fill="${colors[1]}"/>
    <rect x="565" y="440" width="70" height="480" fill="${colors[2]}"/>
    <path d="M600 440 C520 330 420 360 470 430 C500 470 560 450 600 440 Z" fill="${colors[2]}"/>
    <path d="M600 440 C680 330 780 360 730 430 C700 470 640 450 600 440 Z" fill="${colors[2]}"/>
  </g>`;
}

function ruler(id) {
  let ticks = "";
  for (let i = 0; i <= 20; i++) {
    const x = 200 + i * 40;
    ticks += `<line x1="${x}" y1="930" x2="${x}" y2="${i % 5 === 0 ? 990 : 965}" stroke="#6E5A7E" stroke-width="4"/>`;
    if (i % 5 === 0) ticks += `<text x="${x}" y="1030" text-anchor="middle" font-family="Arial" font-size="26" fill="#6E5A7E">${i / 2}</text>`;
  }
  return `<g filter="url(#shadow-${id})"><rect x="170" y="910" width="860" height="140" rx="20" fill="#FFF7D6"/>${ticks}<text x="1010" y="950" text-anchor="end" font-family="Arial" font-size="22" fill="#6E5A7E">cm</text></g>`;
}

function wrist(id, skin = "#F2C7A5") {
  return `<g filter="url(#shadow-${id})"><path d="M-40 560 L820 590 C880 560 1000 540 1080 600 C1150 650 1140 760 1060 790 C980 820 880 800 820 770 L-40 800 Z" fill="${skin}"/>
  <path d="M-40 790 L820 765" stroke="#D9A783" stroke-width="5" opacity="0.4"/></g>`;
}

function keychain(id, colors, opts = {}) {
  const { cx = 600, cy = 360, letters = "" } = opts;
  let s = `<circle cx="${cx}" cy="${cy}" r="90" fill="none" stroke="#C9C2D3" stroke-width="22"/>
  <circle cx="${cx}" cy="${cy}" r="90" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.6"/>`;
  for (let i = 0; i < 4; i++) s += `<ellipse cx="${cx}" cy="${cy + 120 + i * 44}" rx="16" ry="26" fill="none" stroke="#C9C2D3" stroke-width="9"/>`;
  let y = cy + 320;
  const seq = letters ? letters.split("") : [null, null, null, null, null];
  seq.forEach((l, i) => {
    s += bead(id, cx, y, 52, colors[i % colors.length], l || undefined);
    y += 108;
  });
  return `<g filter="url(#shadow-${id})">${s}</g>`;
}

function mystery(id, colors) {
  return `<g filter="url(#shadow-${id})">
    <circle cx="600" cy="600" r="260" fill="${colors[0]}"/>
    <circle cx="600" cy="600" r="260" fill="url(#shine-${id})"/>
    <text x="600" y="690" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="260" font-weight="700" fill="#FFFFFF">?</text>
  </g>
  <path d="M900 320 l18 44 44 18 -44 18 -18 44 -18 -44 -44 -18 44 -18z" fill="${colors[1]}"/>
  <path d="M290 860 l12 30 30 12 -30 12 -12 30 -12 -30 -30 -12 30 -12z" fill="${colors[2]}"/>`;
}

function scrunchies(id, colors) {
  let s = "";
  colors.slice(0, 3).forEach((c, i) => {
    const cx = 380 + i * 220;
    const cy = 600 + (i % 2 ? -60 : 40);
    let g = "";
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      g += `<ellipse cx="${cx + Math.cos(a) * 110}" cy="${cy + Math.sin(a) * 110}" rx="58" ry="46" fill="${c}" transform="rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 110} ${cy + Math.sin(a) * 110})"/>`;
    }
    g += `<circle cx="${cx}" cy="${cy}" r="62" fill="url(#bg-${id})"/>`;
    s += `<g filter="url(#shadow-${id})">${g}</g>`;
  });
  return s;
}

/* -------------------------------------------------------------- */

const PAL = {
  candy: ["#ED0C68", "#FAAF04", "#01BDC6", "#7721C2", "#2ED3A2", "#FF8A3D"],
  bun: ["#FF8FC0", "#FFB3D4", "#ED0C68", "#FFFFFF"],
  ocean: ["#01BDC6", "#7FDBFF", "#2ED3A2", "#FFFFFF", "#7721C2"],
  special: ["#7721C2", "#FAAF04", "#ED0C68", "#FFFFFF", "#B9A7FF"],
  pearl: ["#FFFDF7", "#F6EBDD", "#FFFFFF", "#E9D7BD"],
  pastel: ["#FFB3D4", "#B9E9FF", "#FFE6A3", "#C9F4E4", "#DCD3FF"],
  sunset: ["#FF8A3D", "#ED0C68", "#FAAF04", "#FFFFFF"],
  rainbow: ["#FF4F4F", "#FF8A3D", "#FAAF04", "#2ED3A2", "#01BDC6", "#7721C2"],
  glow: ["#C8FF6A", "#7FFFD4", "#FFF06A", "#FF9AE0"],
};

const products = [
  { slug: "bun-bracelet", type: "bracelet", palette: PAL.bun, bg: "pink", sizes: [1, 1, 1.35] },
  { slug: "bead-bracelet", type: "bracelet", palette: PAL.ocean, bg: "sky" },
  { slug: "special-bead-bracelet", type: "bracelet", palette: PAL.special, bg: "grape", sizes: [1, 0.75, 1, 1.25, 0.75] },
  { slug: "keychain", type: "keychain", palette: PAL.candy, bg: "sunny" },
  { slug: "alphabet-bead-bracelet", type: "bracelet", palette: PAL.candy, bg: "mint", letters: "HI5" },
  { slug: "pearl-charm-bracelet", type: "bracelet", palette: PAL.pearl, bg: "peach", gold: true },
  { slug: "pastel-stack-set", type: "stack", palette: PAL.pastel, bg: "cream" },
  { slug: "best-friends-bracelet-duo", type: "duo", palette: PAL.sunset, bg: "pink" },
  { slug: "rainbow-bead-anklet", type: "bracelet", palette: PAL.rainbow, bg: "sunny" },
  { slug: "name-keychain", type: "keychain", palette: PAL.special, bg: "grape", letters: "NAINU", coming: true },
  { slug: "glow-bead-bracelet", type: "bracelet", palette: PAL.glow, bg: "mint", coming: true },
  { slug: "scrunchie-trio", type: "scrunchie", palette: PAL.pastel, bg: "peach", coming: true },
  { slug: "mystery-gift-box", type: "mystery", palette: PAL.candy, bg: "sky", coming: true },
];

const KINDS = [
  ["front", "Front"],
  ["back", "Back"],
  ["close-up", "Close-up"],
  ["detail", "Detail"],
  ["lifestyle", "Lifestyle"],
  ["packaging", "Packaging"],
  ["size-reference", "Size guide"],
];

function scene(p, kind) {
  const id = `${p.slug}-${kind}`.replace(/[^a-z0-9-]/g, "");
  const rand = rng(id);
  const bg = BG[p.bg];
  const conf = confetti(rand, p.palette);
  const ring = (o = {}) =>
    braceletRing(id, { colors: p.palette, letters: p.letters, sizes: p.sizes, ...o });
  let body = "";

  if (p.type === "mystery") {
    body = conf + (kind === "packaging" ? giftBox(id, p.palette) : mystery(id, p.palette));
    return wrap(id, bg, body, kind === "front" ? "" : KINDS.find((k) => k[0] === kind)[1]);
  }
  if (p.type === "scrunchie") {
    body = conf + (kind === "packaging" ? pouch(id, ["#FFFFFF", p.palette[1], "#ED0C68"]) : scrunchies(id, p.palette));
    return wrap(id, bg, body, kind === "front" ? "" : KINDS.find((k) => k[0] === kind)[1]);
  }

  const goldCharm = p.gold
    ? `<g><circle cx="600" cy="${600 + 300}" r="40" fill="#E8B64C"/><circle cx="600" cy="${600 + 300}" r="40" fill="url(#shine-${id})"/><path d="M600 880 l10 14 16 2 -12 10 4 16 -18 -8 -18 8 4 -16 -12 -10 16 -2z" fill="#FFF3C7"/></g>`
    : "";

  const main = () => {
    if (p.type === "keychain") return keychain(id, p.palette, { letters: p.letters });
    if (p.type === "stack")
      return [0, 1, 2].map((i) => ring({ cy: 470 + i * 140, ringR: 290, tilt: 0.42, beadR: 30, colors: rotate(p.palette, i), rotation: i * 20 })).join("");
    if (p.type === "duo")
      return ring({ cx: 450, ringR: 230, beadR: 34 }) + ring({ cx: 760, cy: 640, ringR: 230, beadR: 34, colors: rotate(p.palette, 1), letters: "BFF" });
    return ring({ charm: goldCharm });
  };

  switch (kind) {
    case "front":
      body = conf + main();
      break;
    case "back":
      body =
        conf +
        (p.type === "keychain"
          ? `<g transform="translate(1200 0) scale(-1 1)">${keychain(id, rotate(p.palette, 2), { letters: p.letters })}</g>`
          : `<g transform="rotate(25 600 600)">${main()}</g>`) +
        (p.type === "bracelet" ? `<g><circle cx="600" cy="300" r="22" fill="#F3E6F7"/><path d="M590 300 q-40 -40 -60 -10 M610 300 q40 -40 60 -10" stroke="#F3E6F7" stroke-width="8" fill="none"/></g>` : "");
      break;
    case "close-up":
      body =
        conf +
        `<g filter="url(#shadow-${id})">${[0, 1, 2, 3]
          .map((i) => bead(id, 240 + i * 250, 600 + (i % 2 ? 40 : -40), 120, p.palette[i % p.palette.length], p.letters ? p.letters[i % p.letters.length] : undefined))
          .join("")}</g>`;
      break;
    case "detail":
      body =
        conf +
        `<g transform="translate(-300 -300) scale(1.5)">${main()}</g>` +
        `<circle cx="600" cy="600" r="300" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-dasharray="20 18" opacity="0.8"/>`;
      break;
    case "lifestyle":
      body =
        conf +
        wrist(id) +
        (p.type === "keychain"
          ? `<g transform="translate(160 -120) rotate(18 600 600) scale(0.9)">${keychain(id, p.palette, { letters: p.letters })}</g>`
          : braceletRing(id, { cx: 600, cy: 680, ringR: 150, beadR: 24, tilt: 0.32, colors: p.palette, sizes: p.sizes }).replace("<g ", `<g transform="rotate(92 600 680)" `));
      break;
    case "packaging":
      body = conf + pouch(id, ["#FFFFFF", p.palette[1] ?? "#FFE1EE", p.palette[0]]);
      break;
    case "size-reference":
      body =
        conf +
        (p.type === "keychain"
          ? `<g transform="translate(270 110) scale(0.55)">${main()}</g>`
          : `<g transform="translate(120 20) scale(0.8)">${main()}</g>`) +
        ruler(id) +
        `<text x="600" y="130" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#6E5A7E">Approximate size – for reference only</text>`;
      break;
  }
  return wrap(id, bg, body, kind === "front" ? "" : KINDS.find((k) => k[0] === kind)[1]);
}

function rotate(arr, n) {
  return arr.slice(n).concat(arr.slice(0, n));
}

let count = 0;
for (const p of products) {
  const dir = join(OUT, p.slug);
  mkdirSync(dir, { recursive: true });
  const kinds = p.coming ? KINDS.slice(0, 3).concat([KINDS[5]]) : KINDS;
  for (const [kind] of kinds) {
    writeFileSync(join(dir, `${kind}.svg`), scene(p, kind));
    count++;
  }
}
console.log(`Generated ${count} illustrations in ${OUT}`);
