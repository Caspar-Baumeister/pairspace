/**
 * Deleting an application removes everything about that person. The same
 * code runs whoever deleted the profile: the applicant ("Bewerbung löschen"),
 * the landlord ("Bewerbungen löschen") or the flat going away.
 *
 * Only things older than the deletion are removed. Someone who deletes and
 * applies again right away keeps their new photos, ballot and contact.
 */
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import { bucket, db } from "./admin";

export interface ApplicantCleanup {
  photos: number;
  subdocs: number;
  ballot: boolean;
  /** Ballots of others that rated this person. */
  ratingsRemoved: number;
}

const NOT_FOUND = 5;
const FAILED_PRECONDITION = 9;

function ignoreGone(e: unknown): void {
  const code = (e as { code?: number | string }).code;
  if (code === NOT_FOUND || code === FAILED_PRECONDITION || code === 404) return;
  throw e;
}

async function deleteFiles(prefix: string, olderThan = Infinity): Promise<number> {
  const [files] = await bucket().getFiles({ prefix });
  let n = 0;
  for (const file of files) {
    const created = Date.parse(String(file.metadata.timeCreated ?? ""));
    if (Number.isFinite(created) && created > olderThan) continue;
    await file.delete({ ignoreNotFound: true });
    n++;
  }
  return n;
}

export async function handleApplicantDeleted(flatId: string, uid: string, deletedAt: number): Promise<ApplicantCleanup> {
  const report: ApplicantCleanup = { photos: 0, subdocs: 0, ballot: false, ratingsRemoved: 0 };

  // Photos in Storage. The path belongs to the applicant, so the client of a
  // landlord could never remove them.
  report.photos = await deleteFiles(`flats/${flatId}/applicants/${uid}/`, deletedAt);

  // private/contact, server/mail and anything else below the profile.
  const profile = db().doc(`flats/${flatId}/applicants/${uid}`);
  for (const col of await profile.listCollections()) {
    for (const snap of (await col.get()).docs) {
      if (snap.updateTime.toMillis() > deletedAt) continue;
      await db().recursiveDelete(snap.ref);
      report.subdocs++;
    }
  }

  // Their own ballot.
  const own = await db().doc(`flats/${flatId}/ballots/${uid}`).get();
  if (own.exists && own.updateTime!.toMillis() <= deletedAt) {
    await own.ref.delete({ lastUpdateTime: own.updateTime! }).catch(ignoreGone);
    report.ballot = true;
  }

  // Their uid as a key in everyone else's ratings. update() never recreates a
  // ballot that is being deleted at the same time.
  const ballots = await db().collection(`flats/${flatId}/ballots`).get();
  for (const b of ballots.docs) {
    if (b.id === uid) continue;
    const votes = b.get("votes") as Record<string, unknown> | undefined;
    if (!votes || !(uid in votes)) continue;
    await b.ref
      .update(new FieldPath("votes", uid), FieldValue.delete())
      .then(() => report.ratingsRemoved++)
      .catch(ignoreGone);
  }

  console.log("[cleanup] applicant", { flatId, uid, ...report });
  return report;
}

export interface FlatCleanup {
  applicantFiles: number;
  roomFiles: number;
}

/**
 * Whatever is left below a deleted flat: profiles (each one runs
 * handleApplicantDeleted on its own), ballots, applicant photos and room photos.
 */
export async function handleFlatDeleted(flatId: string, ownerUid: string | null | undefined): Promise<FlatCleanup> {
  await db().recursiveDelete(db().doc(`flats/${flatId}`));
  const report: FlatCleanup = {
    applicantFiles: await deleteFiles(`flats/${flatId}/`),
    roomFiles: ownerUid ? await deleteFiles(`landlords/${ownerUid}/flats/${flatId}/`) : 0,
  };
  console.log("[cleanup] flat", { flatId, ...report });
  return report;
}
