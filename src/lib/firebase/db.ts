"use client";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { firebase } from "./client";
import { buildSlug, token } from "../slug";
import type {
  Connection,
  EventDraft,
  PairspaceEvent,
  Participant,
  ParticipantContact,
  SharedContacts,
  Watcher,
} from "../types";

const now = () => Date.now();

/* Events ------------------------------------------------------------------- */

export async function createEvent(draft: EventDraft, ownerUid: string): Promise<PairspaceEvent> {
  const { db } = firebase();
  const eventRef = doc(collection(db, "events"));
  const slug = buildSlug(draft.name);

  const event: PairspaceEvent = {
    id: eventRef.id,
    slug,
    ownerUid,
    name: draft.name.trim(),
    location: draft.location.trim(),
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    description: draft.description.trim(),
    categories: draft.categories,
    questions: draft.questions,
    visibility: draft.visibility,
    allowPhotos: draft.allowPhotos,
    requirePhotos: draft.allowPhotos && draft.requirePhotos,
    status: "live",
    retentionDays: draft.retentionDays,
    createdAt: now(),
    updatedAt: now(),
    counts: { participants: 0, watchers: 0, connections: 0, openForPartner: 0 },
  };

  await runTransaction(db, async (tx) => {
    const slugRef = doc(db, "slugs", slug);
    const existing = await tx.get(slugRef);
    if (existing.exists()) throw new Error("Slug collision, please try again");
    tx.set(eventRef, { ...event, serverCreatedAt: serverTimestamp() });
    tx.set(slugRef, { eventId: eventRef.id, ownerUid, createdAt: now() });
    tx.set(
      doc(db, "users", ownerUid),
      { uid: ownerUid, updatedAt: now() },
      { merge: true },
    );
  });

  return event;
}

export async function getEventById(eventId: string): Promise<PairspaceEvent | null> {
  const { db } = firebase();
  const snap = await getDoc(doc(db, "events", eventId));
  return snap.exists() ? (snap.data() as PairspaceEvent) : null;
}

export async function getEventBySlug(slug: string): Promise<PairspaceEvent | null> {
  const { db } = firebase();
  const slugSnap = await getDoc(doc(db, "slugs", slug));
  if (!slugSnap.exists()) return null;
  return getEventById(slugSnap.data().eventId as string);
}

export async function listEventsForOwner(uid: string): Promise<PairspaceEvent[]> {
  const { db } = firebase();
  const q = query(
    collection(db, "events"),
    where("ownerUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PairspaceEvent);
}

export async function updateEvent(eventId: string, patch: Partial<PairspaceEvent>) {
  const { db } = firebase();
  await updateDoc(doc(db, "events", eventId), { ...patch, updatedAt: now() });
}

/** Attaches an owner to an event that was created before the organizer signed in. */
export async function claimEvent(eventId: string, uid: string) {
  const { db } = firebase();
  await updateDoc(doc(db, "events", eventId), { ownerUid: uid, updatedAt: now() });
}

/* Participants ------------------------------------------------------------- */

export function watchParticipants(
  eventId: string,
  onChange: (rows: Participant[]) => void,
): Unsubscribe {
  const { db } = firebase();
  const q = query(
    collection(db, "events", eventId, "participants"),
    orderBy("createdAt", "desc"),
    limit(500),
  );
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => d.data() as Participant)));
}

export async function listParticipants(eventId: string): Promise<Participant[]> {
  const { db } = firebase();
  const snap = await getDocs(
    query(collection(db, "events", eventId, "participants"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => d.data() as Participant);
}

export async function findMyParticipant(
  eventId: string,
  uid: string,
): Promise<Participant | null> {
  const { db } = firebase();
  const snap = await getDocs(
    query(collection(db, "events", eventId, "participants"), where("uid", "==", uid), limit(1)),
  );
  return snap.empty ? null : (snap.docs[0].data() as Participant);
}

/**
 * Writes the public profile and, right after it, the private contact document.
 * Two writes rather than one batch, because the contact rules look up the
 * profile to check ownership and need it to exist first.
 *
 * Profiles saved before contact details moved out of the public document still
 * carry an email there. Saving again strips it.
 */
export async function saveParticipant(
  eventId: string,
  uid: string,
  data: Omit<Participant, "id" | "eventId" | "uid" | "createdAt" | "updatedAt" | "editToken">,
  contact: { email: string; phone: string },
  existingId?: string,
): Promise<Participant> {
  const { db } = firebase();
  const ref = existingId
    ? doc(db, "events", eventId, "participants", existingId)
    : doc(collection(db, "events", eventId, "participants"));

  const previous = existingId ? await getDoc(ref) : null;
  const record: Participant = {
    ...data,
    id: ref.id,
    eventId,
    uid,
    createdAt: previous?.exists() ? (previous.data().createdAt as number) : now(),
    updatedAt: now(),
    editToken: previous?.exists() ? (previous.data().editToken as string) : token(),
  };
  await setDoc(
    ref,
    { ...record, email: deleteField(), emailVerified: deleteField() },
    { merge: true },
  );

  const contactRecord: ParticipantContact = {
    uid,
    email: contact.email.trim().toLowerCase(),
    phone: contact.phone.trim(),
    updatedAt: now(),
  };
  await setDoc(doc(ref, "private", "contact"), contactRecord);
  return record;
}

/** The participant's own contact details. Null for profiles that never saved any. */
export async function getMyContact(
  eventId: string,
  participantId: string,
): Promise<ParticipantContact | null> {
  const { db } = firebase();
  const snap = await getDoc(doc(db, "events", eventId, "participants", participantId, "private", "contact"));
  return snap.exists() ? (snap.data() as ParticipantContact) : null;
}

/** Contacts released to this participant through accepted connections. */
export function watchSharedContacts(
  eventId: string,
  participantId: string,
  onChange: (shared: SharedContacts | null) => void,
): Unsubscribe {
  const { db } = firebase();
  return onSnapshot(
    doc(db, "events", eventId, "participants", participantId, "private", "shared"),
    (snap) => onChange(snap.exists() ? (snap.data() as SharedContacts) : null),
    () => onChange(null),
  );
}

export async function setParticipantOpen(eventId: string, participantId: string, open: boolean) {
  const { db } = firebase();
  await updateDoc(doc(db, "events", eventId, "participants", participantId), {
    open,
    updatedAt: now(),
  });
}

export async function deleteParticipant(eventId: string, participantId: string) {
  const { db } = firebase();
  const ref = doc(db, "events", eventId, "participants", participantId);
  // Private documents first: their rules look up the profile to check ownership.
  await Promise.all([
    deleteDoc(doc(ref, "private", "contact")).catch(() => undefined),
    deleteDoc(doc(ref, "private", "shared")).catch(() => undefined),
  ]);
  await deleteDoc(ref);
}

/* Watchers ----------------------------------------------------------------- */

export async function addWatcher(
  eventId: string,
  email: string,
  lookingForIds: string[],
): Promise<Watcher> {
  const { db } = firebase();
  const ref = doc(collection(db, "events", eventId, "watchers"));
  const record: Watcher = {
    id: ref.id,
    eventId,
    email: email.trim().toLowerCase(),
    lookingForIds,
    createdAt: now(),
    notifiedAt: null,
    confirmed: false,
    confirmToken: token(),
  };
  await setDoc(ref, record);
  return record;
}

export async function listWatchers(eventId: string): Promise<Watcher[]> {
  const { db } = firebase();
  const snap = await getDocs(
    query(collection(db, "events", eventId, "watchers"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => d.data() as Watcher);
}

/* Connections -------------------------------------------------------------- */

export async function requestConnection(
  eventId: string,
  fromParticipantId: string,
  toParticipantId: string,
  message: string,
): Promise<Connection> {
  const { db } = firebase();
  // The id goes in with the first write. A second write to add it would be
  // refused, the update rule only allows the status fields to change.
  const ref = doc(collection(db, "events", eventId, "connections"));
  const record: Connection = {
    id: ref.id,
    eventId,
    fromParticipantId,
    toParticipantId,
    message: message.trim().slice(0, 500),
    status: "pending",
    createdAt: now(),
    respondedAt: null,
    contactSharedAt: null,
  };
  await setDoc(ref, record);
  return record;
}

export async function respondToConnection(
  eventId: string,
  connectionId: string,
  status: "accepted" | "declined",
) {
  const { db } = firebase();
  await updateDoc(doc(db, "events", eventId, "connections", connectionId), {
    status,
    respondedAt: now(),
  });
}

export function watchConnections(
  eventId: string,
  onChange: (rows: Connection[]) => void,
): Unsubscribe {
  const { db } = firebase();
  return onSnapshot(
    query(collection(db, "events", eventId, "connections"), orderBy("createdAt", "desc"), limit(300)),
    // Older records were written without an id field, so take it from the document.
    (snap) => onChange(snap.docs.map((d) => ({ ...(d.data() as Connection), id: d.id }))),
  );
}
