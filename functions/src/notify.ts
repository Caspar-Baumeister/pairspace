/**
 * Mails when an applicant profile is complete.
 *
 *   landlord     one mail per applicant, never again for later edits
 *   applicants   the others with `notify` on hear that someone new is there,
 *                at most one mail per person per 24 hours
 *
 * Bookkeeping lives in flats/{flatId}/applicants/{uid}/server/mail. Only the
 * Admin SDK touches it: firestore.rules has no match for `server`, so the
 * catch-all denies every client read and write.
 */
import { FieldValue, type DocumentData, type DocumentSnapshot } from "firebase-admin/firestore";

import { auth, db } from "./admin";
import { send } from "./mail";
import { applicantNewPeople, landlordNewApplicant, toLocale } from "./templates";
import { unsubscribeUrl } from "./unsubscribe";

export const DAY_MS = 24 * 60 * 60 * 1000;
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface MailMarker {
  /** The landlord was mailed about this applicant. */
  landlordMailedAt?: number;
  /** The other applicants were told this person joined. */
  othersMailedAt?: number;
  /** Last "new people to rate" mail this applicant received. */
  lastNotifiedAt?: number;
}

export const applicantRef = (flatId: string, uid: string) => db().doc(`flats/${flatId}/applicants/${uid}`);
export const markerRef = (flatId: string, uid: string) => db().doc(`flats/${flatId}/applicants/${uid}/server/mail`);

/**
 * Claims both announcements of a new applicant in one transaction, so a
 * retried event or a later profile edit never mails twice. Nothing is claimed
 * while the profile is incomplete or already gone again.
 */
async function claimArrival(flatId: string, uid: string): Promise<{ landlord: boolean; others: boolean }> {
  const aRef = applicantRef(flatId, uid);
  const mRef = markerRef(flatId, uid);
  return db().runTransaction(async (tx) => {
    const [a, m] = await Promise.all([tx.get(aRef), tx.get(mRef)]);
    if (!a.exists || a.get("status") !== "complete") return { landlord: false, others: false };
    const marker = (m.data() ?? {}) as MailMarker;
    const now = Date.now();
    const claim = { landlord: marker.landlordMailedAt == null, others: marker.othersMailedAt == null };
    if (claim.landlord || claim.others) {
      tx.set(
        mRef,
        {
          ...(claim.landlord ? { landlordMailedAt: now } : {}),
          ...(claim.others ? { othersMailedAt: now } : {}),
        },
        { merge: true },
      );
    }
    return claim;
  });
}

/** Gives a claim back after a failed send, so the next event can try again. */
async function release(flatId: string, uid: string, field: keyof MailMarker, previous: number | null = null) {
  await markerRef(flatId, uid)
    .update({ [field]: previous ?? FieldValue.delete() })
    .catch(() => undefined);
}

/**
 * Takes the daily mail slot of an applicant. False when they got a mail in
 * the last 24 hours or are gone.
 */
async function takeDailySlot(flatId: string, uid: string, now: number): Promise<{ previous: number | null } | null> {
  const aRef = applicantRef(flatId, uid);
  const mRef = markerRef(flatId, uid);
  return db().runTransaction(async (tx) => {
    const [a, m] = await Promise.all([tx.get(aRef), tx.get(mRef)]);
    if (!a.exists) return null;
    const last = (m.get("lastNotifiedAt") as number | undefined) ?? null;
    if (last !== null && now - last < DAY_MS) return null;
    tx.set(mRef, { lastNotifiedAt: now }, { merge: true });
    return { previous: last };
  });
}

/** The owner's address from Auth, the landlord doc as a fallback. */
async function ownerEmail(ownerUid: string, landlord: DocumentSnapshot): Promise<string | null> {
  const fromAuth = await auth()
    .getUser(ownerUid)
    .then((u) => u.email ?? null)
    .catch(() => null);
  const email = fromAuth ?? (landlord.get("email") as string | null | undefined) ?? null;
  return email && MAIL.test(email) ? email : null;
}

async function mailLandlord(flatId: string, uid: string, flat: DocumentData, applicant: DocumentData): Promise<boolean> {
  const ownerUid = String(flat.ownerUid ?? "");
  if (!ownerUid) return false;
  const landlord = await db().doc(`landlords/${ownerUid}`).get();
  const [to, count] = await Promise.all([
    ownerEmail(ownerUid, landlord),
    db().collection(`flats/${flatId}/applicants`).where("status", "==", "complete").count().get(),
  ]);
  if (!to) {
    // No address will appear by retrying, so the claim stays.
    console.warn("[notify] landlord has no email", { flatId, ownerUid });
    return false;
  }
  const ok = await send(
    landlordNewApplicant({
      to,
      locale: toLocale(landlord.get("locale")),
      flatId,
      applicantUid: uid,
      flatTitle: String(flat.title ?? ""),
      firstName: String(applicant.firstName ?? ""),
      age: typeof applicant.age === "number" ? applicant.age : null,
      occupation: String(applicant.occupation ?? ""),
      applicants: count.data().count,
    }),
  );
  if (!ok) await release(flatId, uid, "landlordMailedAt");
  return ok;
}

/** Returns the uids that were mailed. One after the other, Resend counts requests per second. */
async function mailOthers(flatId: string, newUid: string, flat: DocumentData): Promise<string[]> {
  const complete = await db().collection(`flats/${flatId}/applicants`).where("status", "==", "complete").get();
  const mailed: string[] = [];
  for (const other of complete.docs) {
    if (other.id === newUid) continue;
    const contact = await other.ref.collection("private").doc("contact").get();
    const email = contact.get("email");
    if (contact.get("notify") !== true || typeof email !== "string" || !MAIL.test(email)) continue;

    const now = Date.now();
    const slot = await takeDailySlot(flatId, other.id, now);
    if (!slot) continue;

    const ballot = await db().doc(`flats/${flatId}/ballots/${other.id}`).get();
    const votes = (ballot.get("votes") as Record<string, number> | undefined) ?? {};
    const unrated = complete.docs.filter((d) => d.id !== other.id && votes[d.id] === undefined).length;

    const ok = await send(
      applicantNewPeople({
        to: email,
        locale: toLocale(contact.get("locale")),
        flatId,
        recipientUid: other.id,
        newUid,
        flatTitle: String(flat.title ?? ""),
        unrated,
        unsubscribeUrl: unsubscribeUrl(flatId, other.id),
      }),
    );
    if (ok) mailed.push(other.id);
    else await release(flatId, other.id, "lastNotifiedAt", slot.previous);
  }
  return mailed;
}

export interface WrittenResult {
  landlord: boolean;
  notified: string[];
}

/** Runs on every write of an applicant profile. Cheap when there is nothing to do. */
export async function handleApplicantWritten(
  flatId: string,
  uid: string,
  after: DocumentData | undefined,
): Promise<WrittenResult> {
  const none: WrittenResult = { landlord: false, notified: [] };
  if (!after || after.status !== "complete") return none;

  const claim = await claimArrival(flatId, uid);
  if (!claim.landlord && !claim.others) return none;

  const flatSnap = await db().doc(`flats/${flatId}`).get();
  const flat = flatSnap.data();
  if (!flat) return none;

  const landlord = claim.landlord ? await mailLandlord(flatId, uid, flat, after) : false;
  const notified = claim.others && flat.status === "live" ? await mailOthers(flatId, uid, flat) : [];
  return { landlord, notified };
}
