/**
 * Avatar resolution.
 *
 * Order of preference:
 *   1. a photo the participant uploaded, when the organizer allows photos
 *   2. an illustrated portrait from the pre rendered pool, picked by a stable
 *      hash of the participant id, so the same person always gets the same face
 *   3. initials, only when neither is available
 *
 * The pool lives in public/avatars and is produced by scripts/generate-avatars.mjs.
 */

export const AVATAR_POOL_SIZE = 48;

/** FNV style hash. Small, stable across runtimes, good enough to spread ids. */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function poolAvatar(seed: string): string {
  const index = hashSeed(seed) % AVATAR_POOL_SIZE;
  return `/avatars/p${String(index).padStart(2, "0")}.svg`;
}

export function castAvatar(seed: string): string {
  return `/avatars/cast-${seed}.svg`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Soft background tints, chosen from the same stable hash. */
const TINTS = ["#E7EFE3", "#F9E6DB", "#EFE7FA", "#E3F1EC", "#FBF0DC", "#E8EFF6"];

export function tintFor(seed: string): string {
  return TINTS[hashSeed(seed) % TINTS.length];
}
