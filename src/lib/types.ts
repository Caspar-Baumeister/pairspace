/**
 * Pairspace data model.
 *
 * Firestore layout
 *   events/{eventId}
 *   events/{eventId}/participants/{participantId}
 *   events/{eventId}/watchers/{watcherId}        email only, no profile
 *   events/{eventId}/connections/{connectionId}  a contact exchange between two participants
 *   events/{eventId}/stats/rollup                counters kept by Cloud Functions
 *   users/{uid}                                  organizer record
 *   slugs/{slug}                                 slug to eventId lookup, public read
 */

export type CategoryStyle = "pair" | "single";

/** One participant category the organizer offers, for example Base or Flyer. */
export interface EventCategory {
  id: string;
  label: string;
  /** Ids this category is looking for. Base pairs with Flyer, Leader with Follower. */
  matchesWith: string[];
  description?: string;
}

export type QuestionType = "single" | "multi" | "text" | "range";

/** An extra question the organizer asks every participant. */
export interface EventQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  /** Answers to this question influence the match score. */
  usedForMatching: boolean;
  helpText?: string;
}

export type EventStatus = "draft" | "live" | "closed";

export interface PairspaceEvent {
  id: string;
  slug: string;
  ownerUid: string | null;
  name: string;
  /** Where the event happens, free text such as "Berlin, Germany". */
  location: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  categories: EventCategory[];
  questions: EventQuestion[];
  /** Participants may show their first name and their answers to other participants. */
  visibility: "participants" | "organizerOnly";
  status: EventStatus;
  /** Profiles are deleted this many days after the event ends. */
  retentionDays: number;
  createdAt: number;
  updatedAt: number;
  counts: EventCounts;
}

export interface EventCounts {
  participants: number;
  watchers: number;
  connections: number;
  openForPartner: number;
}

export interface ParticipantAnswer {
  questionId: string;
  value: string | string[];
}

export interface Participant {
  id: string;
  eventId: string;
  /** Firebase anonymous auth uid, used so a person can edit their own profile. */
  uid: string;
  firstName: string;
  categoryIds: string[];
  lookingForIds: string[];
  answers: ParticipantAnswer[];
  note: string;
  /** Never shown to other participants. Only released through an accepted connection. */
  email: string;
  emailVerified: boolean;
  /** Still looking for a partner. Set to false once someone found one. */
  open: boolean;
  notifyOnMatch: boolean;
  createdAt: number;
  updatedAt: number;
  /** Random secret in the edit link so a person can come back from another device. */
  editToken: string;
}

/** Someone who only wants an email when a matching participant joins. */
export interface Watcher {
  id: string;
  eventId: string;
  email: string;
  lookingForIds: string[];
  createdAt: number;
  notifiedAt: number | null;
  confirmed: boolean;
  confirmToken: string;
}

export type ConnectionStatus = "pending" | "accepted" | "declined" | "expired";

export interface Connection {
  id: string;
  eventId: string;
  fromParticipantId: string;
  toParticipantId: string;
  message: string;
  status: ConnectionStatus;
  createdAt: number;
  respondedAt: number | null;
  /** Set by the Cloud Function once both addresses were mailed out. */
  contactSharedAt: number | null;
}

export interface OrganizerProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  eventIds: string[];
}

/** Shape of the draft kept in local storage while the organizer builds an event. */
export interface EventDraft {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  categories: EventCategory[];
  questions: EventQuestion[];
  visibility: PairspaceEvent["visibility"];
  retentionDays: number;
}

export interface MatchResult {
  participant: Participant;
  score: number;
  reasons: string[];
}
