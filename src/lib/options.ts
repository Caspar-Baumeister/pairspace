import type { Cleanliness, FlatLife, Rhythm, Stay, Vote } from "./types";

export interface VoteOption {
  value: Vote;
  label: string;
  short: string;
  /** CSS colour token. */
  color: string;
}

/** Order matters, it is the order of the buttons from left to right. */
export const VOTES: VoteOption[] = [
  { value: -2, label: "Auf keinen Fall", short: "Nein", color: "var(--color-red)" },
  { value: -1, label: "Schlecht", short: "Schlecht", color: "var(--color-orange)" },
  { value: 0, label: "Mittel", short: "Mittel", color: "var(--color-yellow)" },
  { value: 1, label: "Gut", short: "Gut", color: "var(--color-green)" },
  { value: 2, label: "Unbedingt", short: "Unbedingt", color: "var(--color-accent)" },
];

export function voteOption(v: Vote | null | undefined): VoteOption | null {
  return VOTES.find((o) => o.value === v) ?? null;
}

export const INTERESTS = [
  "Kochen",
  "Sport",
  "Laufen",
  "Yoga",
  "Klettern",
  "Musik",
  "Konzerte",
  "Festivals",
  "Kino",
  "Serien",
  "Gaming",
  "Lesen",
  "Kunst",
  "Fotografie",
  "Reisen",
  "Wandern",
  "Fahrrad",
  "Pflanzen",
  "Brettspiele",
  "Feiern",
  "Kaffee",
  "Wein",
  "Vegetarisch",
  "Vegan",
  "Nachhaltigkeit",
  "Politik",
  "Tech",
  "Mode",
  "Tanzen",
  "Ehrenamt",
] as const;

export const MAX_INTERESTS = 5;
export const MAX_PHOTOS = 6;

export const LANGUAGES = ["Deutsch", "Englisch", "Spanisch", "Französisch", "Italienisch", "Türkisch", "Arabisch", "Polnisch", "Russisch", "Portugiesisch"];

export const CLEANLINESS: { value: Cleanliness; label: string }[] = [
  { value: "relaxed", label: "Entspannt" },
  { value: "normal", label: "Normal" },
  { value: "tidy", label: "Sehr ordentlich" },
];

export const FLAT_LIFE: { value: FlatLife; label: string }[] = [
  { value: "solo", label: "Eher für mich" },
  { value: "mixed", label: "Mal so, mal so" },
  { value: "together", label: "Viel zusammen" },
];

export const RHYTHM: { value: Rhythm; label: string }[] = [
  { value: "early", label: "Frühaufsteher" },
  { value: "flexible", label: "Flexibel" },
  { value: "night", label: "Nachteule" },
];

export const STAY: { value: Stay; label: string }[] = [
  { value: "short", label: "Bis 6 Monate" },
  { value: "medium", label: "6 bis 12 Monate" },
  { value: "long", label: "Länger als ein Jahr" },
];

export function labelOf<T extends string>(list: { value: T; label: string }[], value: T | null | undefined) {
  return list.find((o) => o.value === value)?.label ?? null;
}

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}
