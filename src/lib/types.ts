/**
 * Pairspace data model.
 *
 * Firestore layout
 *   events/{eventId}
 *   events/{eventId}/participants/{participantId}
 *   events/{eventId}/participants/{participantId}/private/contact   own contact details, owner only
 *   events/{eventId}/participants/{participantId}/private/shared    contacts released to this person
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
  /**
   * Participants may upload a photo of themselves. Off by default, because an
   * illustrated portrait is enough for most events and asking for a face photo
   * raises the bar to join.
   */
  allowPhotos: boolean;
  /** A photo is required rather than optional. Only meaningful with allowPhotos. */
  requirePhotos: boolean;
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

/**
 * How a participant wants to be reached.
 *   email     notifications by email, address released on an accepted connection
 *   whatsapp  phone number released on an accepted connection, no notifications
 *   link      nothing leaves the event page, the person checks back for requests
 */
export type ContactMethod = "email" | "whatsapp" | "link";

/**
 * Private contact details. Lives in participants/{id}/private/contact, readable
 * only by the participant and the Cloud Functions. Never in the public profile.
 */
export interface ParticipantContact {
  /** Owner uid, checked by the security rules. */
  uid: string;
  email: string;
  /** Phone number as typed, with country code. Empty when not given. */
  phone: string;
  updatedAt: number;
}

/** One contact released to a participant after both sides accepted. */
export interface SharedContact {
  participantId: string;
  connectionId: string;
  firstName: string;
  email: string;
  phone: string;
  sharedAt: number;
}

/** participants/{id}/private/shared, written by the Cloud Functions only. */
export interface SharedContacts {
  uid: string;
  contacts: Record<string, SharedContact>;
  updatedAt: number;
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
  /** Download URL of the uploaded photo, when the event allows photos. */
  photoUrl: string | null;
  /** Storage path, kept so the photo can be deleted with the profile. */
  photoPath: string | null;
  /** Which channels this person offered. The details themselves live in private/contact. */
  contactMethods: ContactMethod[];
  /** Still looking for a partner. Set to false once someone found one. */
  open: boolean;
  /** Email when a matching participant joins. Only meaningful with an email address. */
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
  allowPhotos: boolean;
  requirePhotos: boolean;
  retentionDays: number;
}

export interface MatchResult {
  participant: Participant;
  score: number;
  reasons: string[];
}

/* Feedback ----------------------------------------------------------------- */

/** When the person was asked. */
export type FeedbackMoment = "joined" | "matched" | "later";
export type FeedbackMood = "loved" | "okay" | "off";

export interface Feedback {
  id: string;
  uid: string;
  eventId: string;
  eventName: string;
  participantId: string | null;
  moment: FeedbackMoment;
  mood: FeedbackMood | null;
  text: string;
  /** Only set when the person ticked the box that we may write back. */
  email: string | null;
  createdAt: number;
}
