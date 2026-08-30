const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** Short, unambiguous suffix. No characters that look alike. */
export function randomCode(length = 5): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Builds the public event slug, for example "acro-weekend-berlin-k4m7p". */
export function buildSlug(name: string): string {
  const base = slugify(name) || "event";
  return `${base}-${randomCode()}`;
}

export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function eventUrl(slug: string): string {
  return `${siteUrl()}/e/${slug}`;
}

export function token(): string {
  return randomCode(24);
}
