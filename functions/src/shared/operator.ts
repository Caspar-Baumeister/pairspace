/**
 * Who runs Pairspace and the version of the legal texts. Shared with the
 * website, see doc.ts for the rules of this folder.
 */

export const SITE = "https://joinpairspace.com";

export const OPERATOR = {
  name: "Caspar Baumeister",
  street: "Dernburgstraße 7",
  city: "14057 Berlin",
  country: { de: "Deutschland", en: "Germany" },
  // Like Immotrim: joinpairspace.com has no mailbox, so contact and replies go to Gmail.
  email: "caspar.baumeister.privat@gmail.com",
} as const;

/** Shown as "Stand" on every legal page and named in the contract confirmation. Update it whenever a text changes. */
export const LEGAL_UPDATED = { de: "4. November 2026", en: "4 November 2026" } as const;

/** The two buttons the law asks for, § 312k and § 356a BGB. Public, no sign in. */
export const CANCEL_PATH = "/kuendigen";
export const WITHDRAW_PATH = "/widerrufen";
