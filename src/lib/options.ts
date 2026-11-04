import { intlLocale, type Locale } from "./i18n";
import type { Cleanliness, FlatLife, Rhythm, Stay, Vote } from "./types";

/** A label in both languages, pick one with t(x.de, x.en) or say(x, locale). */
export interface Label {
  de: string;
  en: string;
}

export const say = (label: Label, locale: Locale) => label[locale];

export interface VoteOption {
  value: Vote;
  label: Label;
  short: Label;
  /** CSS colour token. */
  color: string;
}

/** Order matters, it is the order of the buttons from left to right. */
export const VOTES: VoteOption[] = [
  { value: -2, label: { de: "Auf keinen Fall", en: "No way" }, short: { de: "Nein", en: "No" }, color: "var(--color-red)" },
  { value: -1, label: { de: "Schlecht", en: "Bad" }, short: { de: "Schlecht", en: "Bad" }, color: "var(--color-orange)" },
  { value: 0, label: { de: "Mittel", en: "Okay" }, short: { de: "Mittel", en: "Okay" }, color: "var(--color-yellow)" },
  { value: 1, label: { de: "Gut", en: "Good" }, short: { de: "Gut", en: "Good" }, color: "var(--color-green)" },
  { value: 2, label: { de: "Unbedingt", en: "Absolutely" }, short: { de: "Unbedingt", en: "Absolutely" }, color: "var(--color-accent)" },
];

export function voteOption(v: Vote | null | undefined): VoteOption | null {
  return VOTES.find((o) => o.value === v) ?? null;
}

/**
 * Interests and languages are stored as the German word, so profiles saved
 * in either language stay comparable. Show them with interestLabel and
 * languageLabel.
 */
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

const INTERESTS_EN: Record<string, string> = {
  Kochen: "Cooking",
  Sport: "Sports",
  Laufen: "Running",
  Yoga: "Yoga",
  Klettern: "Climbing",
  Musik: "Music",
  Konzerte: "Concerts",
  Festivals: "Festivals",
  Kino: "Cinema",
  Serien: "TV series",
  Gaming: "Gaming",
  Lesen: "Reading",
  Kunst: "Art",
  Fotografie: "Photography",
  Reisen: "Travel",
  Wandern: "Hiking",
  Fahrrad: "Cycling",
  Pflanzen: "Plants",
  Brettspiele: "Board games",
  Feiern: "Partying",
  Kaffee: "Coffee",
  Wein: "Wine",
  Vegetarisch: "Vegetarian",
  Vegan: "Vegan",
  Nachhaltigkeit: "Sustainability",
  Politik: "Politics",
  Tech: "Tech",
  Mode: "Fashion",
  Tanzen: "Dancing",
  Ehrenamt: "Volunteering",
};

export function interestLabel(value: string, locale: Locale): string {
  return locale === "en" ? (INTERESTS_EN[value] ?? value) : value;
}

export const MAX_INTERESTS = 5;
export const MAX_PHOTOS = 6;

export const LANGUAGES = ["Deutsch", "Englisch", "Spanisch", "Französisch", "Italienisch", "Türkisch", "Arabisch", "Polnisch", "Russisch", "Portugiesisch"];

const LANGUAGES_EN: Record<string, string> = {
  Deutsch: "German",
  Englisch: "English",
  Spanisch: "Spanish",
  Französisch: "French",
  Italienisch: "Italian",
  Türkisch: "Turkish",
  Arabisch: "Arabic",
  Polnisch: "Polish",
  Russisch: "Russian",
  Portugiesisch: "Portuguese",
};

export function languageLabel(value: string, locale: Locale): string {
  return locale === "en" ? (LANGUAGES_EN[value] ?? value) : value;
}

export const CLEANLINESS: { value: Cleanliness; label: Label }[] = [
  { value: "relaxed", label: { de: "Entspannt", en: "Relaxed" } },
  { value: "normal", label: { de: "Normal", en: "Normal" } },
  { value: "tidy", label: { de: "Sehr ordentlich", en: "Very tidy" } },
];

export const FLAT_LIFE: { value: FlatLife; label: Label }[] = [
  { value: "solo", label: { de: "Eher für mich", en: "Mostly on my own" } },
  { value: "mixed", label: { de: "Mal so, mal so", en: "A bit of both" } },
  { value: "together", label: { de: "Viel zusammen", en: "Lots together" } },
];

export const RHYTHM: { value: Rhythm; label: Label }[] = [
  { value: "early", label: { de: "Frühaufsteher", en: "Early bird" } },
  { value: "flexible", label: { de: "Flexibel", en: "Flexible" } },
  { value: "night", label: { de: "Nachteule", en: "Night owl" } },
];

export const STAY: { value: Stay; label: Label }[] = [
  { value: "short", label: { de: "Bis 6 Monate", en: "Up to 6 months" } },
  { value: "medium", label: { de: "6 bis 12 Monate", en: "6 to 12 months" } },
  { value: "long", label: { de: "Länger als ein Jahr", en: "More than a year" } },
];

export function labelOf<T extends string>(
  list: { value: T; label: Label }[],
  value: T | null | undefined,
  locale: Locale,
): string | null {
  const found = list.find((o) => o.value === value);
  return found ? found.label[locale] : null;
}

export function formatDate(iso: string | null | undefined, locale: Locale): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" });
}
