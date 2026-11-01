/**
 * Pairspace data model: matching flatmates for furnished shared flats.
 *
 * Firestore layout
 *   landlords/{uid}                                   landlord account, owner only.
 *                                                     `subscription` is written by the server only.
 *   flats/{flatId}                                    one flat (a "project"). The id is also the
 *                                                     code in the public link /w/{flatId}.
 *                                                     Readable by anyone once status is live.
 *   flats/{flatId}/applicants/{uid}                   applicant profile, visible to the landlord
 *                                                     and to the other applicants of this flat
 *   flats/{flatId}/applicants/{uid}/private/contact   mail and phone, applicant and landlord only
 *   flats/{flatId}/ballots/{uid}                      how this applicant rated the others and
 *                                                     ranked the rooms, applicant and landlord only
 *
 * Storage layout
 *   landlords/{uid}/flats/{flatId}/{roomId}.webp      room photos, written by the landlord
 *   landlords/{uid}/avatar.webp                       landlord photo
 *   flats/{flatId}/applicants/{uid}/{photoId}.webp    applicant photos, written by the applicant
 *
 * Timestamps are milliseconds since epoch.
 */

export interface Photo {
  url: string;
  path: string;
}

/* ------------------------------------------------------------------ landlord */

export type PlanInterval = "month" | "year";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface Subscription {
  plan: "basic";
  interval: PlanInterval;
  status: SubscriptionStatus;
  trialEndsAt: number | null;
  currentPeriodEnd: number;
  /** "prototype" until Stripe is wired up, then "stripe". */
  provider: "prototype" | "stripe";
  stripeCustomerId?: string;
}

export interface Landlord {
  uid: string;
  name: string;
  email: string | null;
  about: string;
  photo: Photo | null;
  createdAt: number;
  updatedAt: number;
  subscription?: Subscription;
}

/* ---------------------------------------------------------------------- flat */

export interface Room {
  id: string;
  name: string;
  /** Monthly rent including utilities, in euro. */
  rent: number | null;
  /** Square metres. */
  size: number | null;
  photo: Photo | null;
  /** ISO date, for example 2026-12-01. */
  availableFrom: string | null;
  note: string;
}

export type FlatStatus = "draft" | "live" | "closed";

export interface Flat {
  id: string;
  ownerUid: string;
  title: string;
  city: string;
  district: string;
  description: string;
  /** Snapshot of the landlord shown to applicants, so they never read the landlord doc. */
  host: { name: string; about: string; photoUrl: string | null };
  rooms: Room[];
  status: FlatStatus;
  createdAt: number;
  updatedAt: number;
}

/* ----------------------------------------------------------------- applicant */

export type Cleanliness = "relaxed" | "normal" | "tidy";
export type FlatLife = "solo" | "mixed" | "together";
export type Rhythm = "early" | "flexible" | "night";
export type Stay = "short" | "medium" | "long";

export interface Lifestyle {
  cleanliness: Cleanliness | null;
  flatLife: FlatLife | null;
  rhythm: Rhythm | null;
  smoker: boolean | null;
  pets: boolean | null;
}

export type ApplicantStatus = "draft" | "complete";

export interface Applicant {
  uid: string;
  firstName: string;
  age: number | null;
  /** What they do, for example "Medizinstudium" or "UX Designerin". */
  occupation: string;
  bio: string;
  photos: Photo[];
  interests: string[];
  languages: string[];
  lifestyle: Lifestyle;
  moveIn: string | null;
  stay: Stay | null;
  /** Draft until the profile step is done. Only complete profiles are shown to others. */
  status: ApplicantStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ApplicantContact {
  email: string;
  phone: string;
  /** Mail me when new applicants join or the landlord gets in touch. */
  notify: boolean;
  updatedAt: number;
}

/* -------------------------------------------------------------------- ballot */

/**
 * Five steps from "no way" to "absolutely". -2 is a veto: a group that contains
 * a veto in either direction is never suggested.
 */
export type Vote = -2 | -1 | 0 | 1 | 2;

export interface Ballot {
  uid: string;
  /** Other applicant uid to vote. Missing means not rated yet. */
  votes: Record<string, Vote>;
  /**
   * Room id to rank, 1 is the favourite. Equal ranks mean equally good
   * (competition ranking, so two favourites give 1, 1, 3).
   */
  roomRanks: Record<string, number>;
  updatedAt: number;
}
