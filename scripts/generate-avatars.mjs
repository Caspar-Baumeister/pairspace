/**
 * Pre renders the avatar pool.
 *
 * The app never generates avatars at runtime. This script writes a fixed pool of
 * line art portraits into public/avatars, and the client picks one from the pool
 * by hashing a participant id. That keeps the avatar library out of the bundle,
 * makes every avatar cacheable, and means a person keeps the same face forever.
 *
 *   npm run avatars
 *
 * Artwork: Open Peeps by Pablo Stanley, CC0, rendered through DiceBear.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createAvatar } from "@dicebear/core";
import { openPeeps } from "@dicebear/collection";

const OUT = join(process.cwd(), "public", "avatars");
const POOL_SIZE = 48;

/**
 * The landing page cast. Every portrait is pinned so a regenerate never changes a
 * face. The brief: sporty, friendly, mostly European looking, all in the same
 * Open Peeps line art as the participant pool.
 *
 * Only a few heads take the hair color (bangs, mediumBangs2, short4, mohawk, the
 * gray ones). Every other head is drawn in black regardless of `hair`.
 */
const CAST = [
  { seed: "lena-weber", head: "bun", face: "smileBig", skin: "ffdbb4", hair: "b58143", clothing: "2b4ef0" },
  { seed: "leo-fischer", head: "short4", face: "smile", skin: "edb98a", hair: "6b4a2f", clothing: "0a0a0b" },
  { seed: "ana-ribeiro", head: "long", face: "cheeky", skin: "d08b5b", hair: "3c3c42", clothing: "3c3c42" },
  { seed: "tomas-nowak", head: "short1", face: "driven", skin: "ffdbb4", hair: "0a0a0b", clothing: "2b4ef0", accessories: "sunglasses" },
  { seed: "sara-lindqvist", head: "mediumBangs2", face: "smile", skin: "ffdbb4", hair: "e0c07e", clothing: "71717a" },
  { seed: "luca-moretti", head: "short5", face: "calm", skin: "edb98a", hair: "0a0a0b", clothing: "0a0a0b", facialHair: "chin" },
  { seed: "emma-nielsen", head: "hatBeanie", face: "smileBig", skin: "ffdbb4", hair: "b58143", clothing: "2b4ef0" },
  { seed: "nora-castillo", head: "mediumBangs3", face: "cheeky", skin: "d08b5b", hair: "3c3c42", clothing: "3c3c42" },
];

mkdirSync(OUT, { recursive: true });

function render(seed) {
  return createAvatar(openPeeps, {
    seed,
    size: 160,
    backgroundColor: ["transparent"],
    // Skin tones stay in the illustrated range of the original artwork.
    skinColor: ["694d3d", "ae5d29", "d08b5b", "edb98a", "ffdbb4"],
    clothingColor: ["0a0a0b", "2b4ef0", "3c3c42", "71717a", "d8d8dc"],
    headContrastColor: ["0a0a0b", "3c3c42", "6b4a2f", "a55728", "b58143"],
    clip: true,
  })
    .toString()
    // The RDF metadata block is a third of the file and never rendered.
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "");
}

function renderCast(p) {
  return createAvatar(openPeeps, {
    seed: p.seed,
    size: 160,
    backgroundColor: ["transparent"],
    head: [p.head],
    face: [p.face],
    skinColor: [p.skin],
    headContrastColor: [p.hair],
    clothingColor: [p.clothing],
    accessories: p.accessories ? [p.accessories] : [],
    accessoriesProbability: p.accessories ? 100 : 0,
    facialHair: p.facialHair ? [p.facialHair] : [],
    facialHairProbability: p.facialHair ? 100 : 0,
    maskProbability: 0,
    clip: true,
  })
    .toString()
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "");
}

const files = [];

for (const p of CAST) {
  const name = `cast-${p.seed}.svg`;
  writeFileSync(join(OUT, name), renderCast(p));
  files.push(name);
}

for (let i = 0; i < POOL_SIZE; i += 1) {
  const name = `p${String(i).padStart(2, "0")}.svg`;
  writeFileSync(join(OUT, name), render(`pairspace-pool-${i}`));
  files.push(name);
}

writeFileSync(
  join(OUT, "manifest.json"),
  JSON.stringify({ poolSize: POOL_SIZE, cast: CAST.map((p) => p.seed), generated: files.length }, null, 2) + "\n",
);

console.log(`Wrote ${files.length} avatars to public/avatars`);
