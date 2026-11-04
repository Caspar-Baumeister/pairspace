#!/usr/bin/env node
/**
 * Renders every app icon from one drawing of the logo mark: three linked
 * nodes, the top one in the accent colour, a tiny version of the graph view.
 *
 *   node scripts/icons.mjs
 *
 * Writes the browser icons Next.js picks up from src/app (favicon.ico,
 * icon.svg, apple-icon.png) and the PWA icons in public, which the manifest
 * and Stripe Checkout use. Commit the results.
 */
import { writeFileSync } from "node:fs";

import sharp from "sharp";

const BG_TOP = "#2b2b2b";
const BG_BOTTOM = "#1a1a1a";
const INK = "#dadada";
const ACCENT = "#8b6cef";

/**
 * The mark on a 1024 canvas. `scale` shrinks it around the centre (maskable
 * icons keep it inside the safe zone), `radius` rounds the background for
 * places that show the file as it is, `bold` thickens it for tiny sizes.
 */
function svg({ radius = 0, scale = 1, bold = false } = {}) {
  const node = bold ? 116 : 96;
  const edge = bold ? 52 : 34;
  const top = [512, 292];
  const left = [296, 676];
  const right = [728, 676];
  const t = (x, y) => `${512 + (x - 512) * scale} ${512 + (y - 512) * scale}`;
  const circle = ([x, y], fill) => {
    const [cx, cy] = t(x, y).split(" ");
    return `<circle cx="${cx}" cy="${cy}" r="${node * scale}" fill="${fill}"/>`;
  };
  const [gx, gy] = t(...top).split(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/>
      <stop offset="1" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${gx}" cy="${gy}" r="${330 * scale}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" rx="${radius}" fill="url(#bg)"/>
  <rect width="1024" height="1024" rx="${radius}" fill="url(#glow)"/>
  <path d="M${t(...left)} L${t(...top)} L${t(...right)} Z" fill="none" stroke="${INK}" stroke-opacity="0.42" stroke-width="${edge * scale}" stroke-linejoin="round"/>
  ${circle(left, INK)}
  ${circle(right, INK)}
  ${circle(top, ACCENT)}
</svg>
`;
}

const png = (source, size) => sharp(Buffer.from(source)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** An .ico that wraps PNGs, which every browser since IE 11 reads. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const rounded = svg({ radius: 224 });
// Browser tabs show 16 to 32 pixels, so the mark gets bigger and heavier there.
const tiny = svg({ radius: 224, bold: true, scale: 1.12 });
const square = svg();
const maskable = svg({ scale: 0.8 });

writeFileSync("src/app/icon.svg", tiny);
writeFileSync("src/app/favicon.ico", ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(tiny, size) })))));
// iOS rounds the corners itself and shows transparency as black.
writeFileSync("src/app/apple-icon.png", await png(square, 180));
writeFileSync("public/icon-192.png", await png(rounded, 192));
writeFileSync("public/icon-512.png", await png(rounded, 512));
writeFileSync("public/icon-maskable-512.png", await png(maskable, 512));
console.log("icons written");
