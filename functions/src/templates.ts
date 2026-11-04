/**
 * Notification mails in German and English, Du form, short and personal.
 * Same copy rule as the app: no Gedankenstriche and no spaced hyphen as a dash.
 * Everything a person typed is escaped before it goes into HTML.
 */
import type { Mail } from "./mail";

export type Locale = "de" | "en";

export const SITE = "https://joinpairspace.com";

export function toLocale(value: unknown): Locale {
  return value === "en" ? "en" : "de";
}

/** German has no prefix, English lives under /en, as in the app. */
export function siteUrl(locale: Locale, path: string): string {
  return `${SITE}${locale === "en" ? "/en" : ""}${path}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Subjects are plain text, but a typed name must not break the line. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export interface NewApplicantMail {
  to: string;
  locale: Locale;
  flatId: string;
  applicantUid: string;
  flatTitle: string;
  firstName: string;
  age: number | null;
  occupation: string;
  /** Complete applications of the flat, the new one included. */
  applicants: number;
}

/** To the landlord, once per applicant, when the profile is complete. */
export function landlordNewApplicant(m: NewApplicantMail): Mail {
  const de = m.locale === "de";
  const name = oneLine(m.firstName) || (de ? "Jemand" : "Someone");
  const flat = oneLine(m.flatTitle) || (de ? "deine Wohnung" : "your flat");
  const details = [m.age ? String(m.age) : "", oneLine(m.occupation)].filter(Boolean).join(", ");
  const who = details ? `${name}, ${details}` : name;
  // "Lena, 27, Medizinstudium, hat ..." needs the closing comma in both languages.
  const lead = `<strong>${escapeHtml(who)}</strong>${details ? "," : ""}`;
  const count =
    m.applicants <= 1
      ? de
        ? `Das ist die erste Bewerbung für ${escapeHtml(flat)}.`
        : `This is the first application for ${escapeHtml(flat)}.`
      : de
        ? `Damit hat ${escapeHtml(flat)} jetzt ${m.applicants} Bewerbungen.`
        : `${escapeHtml(flat)} now has ${m.applicants} applications.`;

  return {
    to: m.to,
    template: "landlord-new-applicant",
    idempotencyKey: `landlord-new-applicant/${m.flatId}/${m.applicantUid}`,
    subject: de ? `Neue Bewerbung für ${flat}: ${name}` : `New application for ${flat}: ${name}`,
    heading: escapeHtml(de ? `${name} hat sich beworben` : `${name} just applied`),
    body: [
      de
        ? `${lead} hat gerade das Profil für ${escapeHtml(flat)} fertig gemacht.`
        : `${lead} just finished their profile for ${escapeHtml(flat)}.`,
      count,
      de
        ? `Im Graphen siehst du, mit wem ${escapeHtml(name)} gut zusammenpasst.`
        : `Open the graph to see who ${escapeHtml(name)} gets along with.`,
    ],
    cta: { label: de ? "Zum Graphen" : "Open the graph", url: siteUrl(m.locale, `/app/w/${m.flatId}`) },
    footer: de
      ? "Du bekommst diese Mail, weil du deine Wohnung auf Pairspace eingestellt hast. Pro Bewerbung kommt genau eine."
      : "You get this email because you listed your flat on Pairspace. There is exactly one per application.",
  };
}

export interface NewPeopleMail {
  to: string;
  locale: Locale;
  flatId: string;
  recipientUid: string;
  newUid: string;
  flatTitle: string;
  /** People this applicant has not rated yet, at least the new one. */
  unrated: number;
  /** Signed one-click link, see unsubscribe.ts. */
  unsubscribeUrl: string | null;
}

/** To an applicant who opted in, at most once a day, when someone new joins. */
export function applicantNewPeople(m: NewPeopleMail): Mail {
  const de = m.locale === "de";
  const flat = escapeHtml(oneLine(m.flatTitle) || (de ? "deine Wohnung" : "your flat"));
  const n = Math.max(1, m.unrated);
  const link = m.unsubscribeUrl
    ? `<a href="${escapeHtml(m.unsubscribeUrl)}" style="color:#b5a3aa">${de ? "Hier mit einem Klick abmelden" : "Unsubscribe with one click"}</a>`
    : null;
  return {
    to: m.to,
    template: "applicant-new-people",
    idempotencyKey: `applicant-new-people/${m.flatId}/${m.recipientUid}/${m.newUid}`,
    subject: de ? `Neue Leute für ${oneLine(m.flatTitle) || "deine Wohnung"}` : `New people for ${oneLine(m.flatTitle) || "your flat"}`,
    heading: de ? "Es gibt neue Leute zum Einschätzen" : "There are new people to rate",
    body: [
      de
        ? `Für ${flat} hat sich gerade jemand Neues beworben.`
        : `Someone new just applied for ${flat}.`,
      n === 1
        ? de
          ? "Eine Person wartet auf deine Einschätzung."
          : "One person is waiting for your rating."
        : de
          ? `${n} Personen warten auf deine Einschätzung.`
          : `${n} people are waiting for your rating.`,
      de
        ? "Je mehr du einschätzt, desto besser sieht der Vermieter, mit wem du gut zusammenpasst."
        : "The more people you rate, the better the landlord can see who you get along with.",
    ],
    cta: { label: de ? "Jetzt einschätzen" : "Rate now", url: siteUrl(m.locale, `/w/${m.flatId}`) },
    footer: de
      ? `Du bekommst diese Mail, weil du Benachrichtigungen für ${flat} eingeschaltet hast, höchstens eine am Tag. ${link ? `${link} oder schalte` : "Abschalten: Schalte"} in deiner Bewerbung "Mail bei neuen Mitbewerbern" aus.`
      : `You get this email because you turned on notifications for ${flat}, at most one a day. ${link ? `${link}, or switch off` : "To stop them, switch off"} "Email me about new applicants" in your application.`,
    // RFC 8058: Gmail, Apple Mail and others show their own unsubscribe button.
    headers: m.unsubscribeUrl
      ? { "List-Unsubscribe": `<${m.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
      : undefined,
  };
}
