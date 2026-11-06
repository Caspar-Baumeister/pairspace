#!/usr/bin/env node
/**
 * Renders the link preview (Open Graph, 1200 x 630) in German and English:
 * the hero headline on the left, a small applicant graph on the right whose
 * best group of three lights up, like the landing page.
 *
 *   node scripts/og-image.mjs
 *
 * Writes public/og-de.png and public/og-en.png, the root layout points to
 * them. Text is set in the macOS system font, so run it on a Mac and commit
 * the results.
 */
import { readdirSync, writeFileSync } from "node:fs";

import sharp from "sharp";

const W = 1200;
const H = 630;
const INK = "#dadada";
const MUTED = "#999999";
const ACCENT = "#8b6cef";
const FONT = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const COPY = {
  de: {
    title: ["Vermiete an Leute,", "die zusammenpassen."],
    sub: ["Bewerber bewerten sich gegenseitig, Pairspace", "findet die beste WG für deine Zimmer."],
  },
  en: {
    title: ["Rent to people", "who fit together."],
    sub: ["Applicants rate each other, Pairspace finds", "the best flatshare for your rooms."],
  },
};

// The graph: positions on the right half, the first three are the best group.
const NODES = [
  { x: 905, y: 250, r: 46, ring: ACCENT },
  { x: 1030, y: 330, r: 42, ring: ACCENT },
  { x: 880, y: 395, r: 40, ring: ACCENT },
  { x: 760, y: 170, r: 30, ring: "#53dfdd" },
  { x: 1080, y: 175, r: 32, ring: "#53dfdd" },
  { x: 760, y: 470, r: 30, ring: "#e9973f" },
  { x: 1000, y: 500, r: 34, ring: "#e9973f" },
  { x: 1125, y: 430, r: 26, ring: "#53dfdd" },
  { x: 785, y: 318, r: 26, ring: "#e9973f" },
  { x: 965, y: 95, r: 26, ring: "#53dfdd" },
];
const BEST = [
  [0, 1],
  [1, 2],
  [0, 2],
];
const EDGES = [
  [0, 3],
  [0, 4],
  [0, 9],
  [1, 4],
  [1, 6],
  [1, 7],
  [2, 5],
  [2, 8],
  [2, 6],
  [3, 8],
  [3, 9],
  [5, 8],
  [6, 7],
  [4, 9],
  [5, 6],
];

const LOGO = `<g transform="translate(64 58) scale(1.5)">
  <path d="M6.5 16.5 12 6.5l5.5 10z" fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="1.5"/>
  <circle cx="12" cy="6.5" r="3" fill="${ACCENT}"/>
  <circle cx="6.5" cy="16.5" r="3" fill="${INK}"/>
  <circle cx="17.5" cy="16.5" r="3" fill="${INK}"/>
</g>`;

function base(lang) {
  const { title, sub } = COPY[lang];
  const line = ([a, b]) => `M${NODES[a].x} ${NODES[a].y} L${NODES[b].x} ${NODES[b].y}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="920" cy="320" r="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#1e1e1e"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${LOGO}
  <text x="108" y="84" font-family="${FONT}" font-size="30" font-weight="600" fill="${INK}" letter-spacing="-0.3">Pairspace</text>
  <text font-family="${FONT}" font-size="62" font-weight="700" fill="#f2f2f2" letter-spacing="-1.6">
    <tspan x="64" y="268">${title[0]}</tspan>
    <tspan x="64" y="342">${title[1]}</tspan>
  </text>
  <text font-family="${FONT}" font-size="27" fill="${MUTED}">
    <tspan x="64" y="420">${sub[0]}</tspan>
    <tspan x="64" y="458">${sub[1]}</tspan>
  </text>
  <text x="64" y="566" font-family="${FONT}" font-size="24" font-weight="600" fill="${ACCENT}">joinpairspace.com</text>
  ${EDGES.map((e) => `<path d="${line(e)}" stroke="${INK}" stroke-opacity="0.22" stroke-width="2"/>`).join("\n  ")}
  ${BEST.map((e) => `<path d="${line(e)}" stroke="${ACCENT}" stroke-opacity="0.9" stroke-width="5"/>`).join("\n  ")}
</svg>`;
}

const rings = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${NODES.map((n, i) => `<circle cx="${n.x}" cy="${n.y}" r="${n.r + 2}" fill="none" stroke="${n.ring}" stroke-width="${i < 3 ? 5 : 3}"/>`).join("\n  ")}
</svg>`;

async function face(file, r) {
  const d = r * 2;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`);
  return sharp(file).resize(d, d, { fit: "cover" }).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

const faces = readdirSync("public/faces")
  .filter((f) => f.endsWith(".webp"))
  .sort();
const portraits = await Promise.all(NODES.map((n, i) => face(`public/faces/${faces[(i * 3) % faces.length]}`, n.r)));

for (const lang of ["de", "en"]) {
  const png = await sharp(Buffer.from(base(lang)))
    .composite([
      ...NODES.map((n, i) => ({ input: portraits[i], left: n.x - n.r, top: n.y - n.r })),
      { input: Buffer.from(rings), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(`public/og-${lang}.png`, png);
}
console.log("og images written");
