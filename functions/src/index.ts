import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";

import { send } from "./mail";

initializeApp();
const db = getFirestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const SITE = process.env.SITE_URL ?? "https://pairspace.app";

function eventLink(slug: string): string {
  return `${SITE}/e/${slug}`;
}

async function recount(eventId: string): Promise<void> {
  const eventRef = db.doc(`events/${eventId}`);
  const [participants, watchers, connections] = await Promise.all([
    eventRef.collection("participants").get(),
    eventRef.collection("watchers").get(),
    eventRef.collection("connections").where("status", "==", "accepted").get(),
  ]);

  await eventRef.set(
    {
      counts: {
        participants: participants.size,
        watchers: watchers.size,
        connections: connections.size,
        openForPartner: participants.docs.filter((d) => d.get("open") === true).length,
      },
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

/**
 * A new participant joined. Tell everyone who was waiting for exactly this
 * category, both watchers and existing participants who asked for updates.
 */
export const onParticipantJoined = onDocumentCreated(
  { document: "events/{eventId}/participants/{participantId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const { eventId } = event.params;
    const joined = event.data?.data();
    if (!joined) return;

    await recount(eventId);

    const eventSnap = await db.doc(`events/${eventId}`).get();
    const eventData = eventSnap.data();
    if (!eventData) return;

    const link = eventLink(eventData.slug as string);
    const joinedCategories: string[] = joined.categoryIds ?? [];
    const categoryLabel = (id: string) =>
      (eventData.categories ?? []).find((c: { id: string }) => c.id === id)?.label ?? id;

    /* Watchers who wanted this category. */
    const watchers = await db.collection(`events/${eventId}/watchers`).get();
    const matchingWatchers = watchers.docs.filter((doc) => {
      const wants: string[] = doc.get("lookingForIds") ?? [];
      if (doc.get("notifiedAt")) return false;
      return wants.length === 0 || wants.some((w) => joinedCategories.includes(w));
    });

    await Promise.all(
      matchingWatchers.map(async (doc) => {
        await send({
          to: doc.get("email") as string,
          subject: `A matching participant joined ${eventData.name}`,
          heading: "Someone matching just joined",
          body: [
            `${joined.firstName} joined <strong>${eventData.name}</strong> as ${joinedCategories
              .map(categoryLabel)
              .join(" and ")}.`,
            "Open the event to see the profile and send a request.",
          ],
          cta: { label: "See who joined", url: link },
        });
        await doc.ref.update({ notifiedAt: Date.now() });
      }),
    );

    /* Participants who asked to hear about new matches. */
    const others = await db
      .collection(`events/${eventId}/participants`)
      .where("notifyOnMatch", "==", true)
      .get();

    await Promise.all(
      others.docs
        .filter((doc) => doc.id !== event.params.participantId && doc.get("open") === true)
        .filter((doc) => {
          const wants: string[] = doc.get("lookingForIds") ?? [];
          return wants.some((w) => joinedCategories.includes(w));
        })
        .map((doc) =>
          send({
            to: doc.get("email") as string,
            subject: `${joined.firstName} matches your search at ${eventData.name}`,
            heading: `${joined.firstName} matches your search`,
            body: [
              `${joined.firstName} joined as ${joinedCategories.map(categoryLabel).join(" and ")}.`,
              "You can send a request from the event page. Your email address stays hidden until you both agree.",
            ],
            cta: { label: "Open the event", url: link },
          }),
        ),
    );
  },
);

export const onParticipantChanged = onDocumentUpdated(
  "events/{eventId}/participants/{participantId}",
  async (event) => {
    await recount(event.params.eventId);
  },
);

export const onParticipantRemoved = onDocumentDeleted(
  "events/{eventId}/participants/{participantId}",
  async (event) => {
    await recount(event.params.eventId);
  },
);

/** A participant asked someone to pair up. Notify the receiver. */
export const onConnectionCreated = onDocumentCreated(
  { document: "events/{eventId}/connections/{connectionId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const { eventId } = event.params;

    const [eventSnap, fromSnap, toSnap] = await Promise.all([
      db.doc(`events/${eventId}`).get(),
      db.doc(`events/${eventId}/participants/${data.fromParticipantId}`).get(),
      db.doc(`events/${eventId}/participants/${data.toParticipantId}`).get(),
    ]);
    if (!eventSnap.exists || !toSnap.exists) return;

    await send({
      to: toSnap.get("email") as string,
      subject: `${fromSnap.get("firstName")} wants to pair up at ${eventSnap.get("name")}`,
      heading: `${fromSnap.get("firstName")} wants to pair up`,
      body: [
        data.message ? `"${data.message}"` : "No message was added.",
        "Open the event to accept. Contact details are exchanged only when you accept.",
      ],
      cta: { label: "Open the event", url: eventLink(eventSnap.get("slug") as string) },
    });
  },
);

/**
 * The request was accepted. This is the only moment an email address leaves the
 * database, and it goes to exactly one person who agreed to receive it.
 */
export const onConnectionAnswered = onDocumentUpdated(
  { document: "events/{eventId}/connections/{connectionId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const { eventId } = event.params;
    await recount(eventId);

    if (after.status !== "accepted") return;

    const [eventSnap, fromSnap, toSnap] = await Promise.all([
      db.doc(`events/${eventId}`).get(),
      db.doc(`events/${eventId}/participants/${after.fromParticipantId}`).get(),
      db.doc(`events/${eventId}/participants/${after.toParticipantId}`).get(),
    ]);
    if (!fromSnap.exists || !toSnap.exists) return;

    const eventName = eventSnap.get("name") as string;
    const pairs: [FirebaseFirestore.DocumentSnapshot, FirebaseFirestore.DocumentSnapshot][] = [
      [fromSnap, toSnap],
      [toSnap, fromSnap],
    ];

    await Promise.all(
      pairs.map(([recipient, other]) =>
        send({
          to: recipient.get("email") as string,
          subject: `You are paired up at ${eventName}`,
          heading: "You are paired up",
          body: [
            `${other.get("firstName")} agreed to pair up with you at <strong>${eventName}</strong>.`,
            `You can reach them at <a href="mailto:${other.get("email")}" style="color:#2B4EF0">${other.get("email")}</a>.`,
            "This address was shared because you both agreed. Nobody else at the event can see it.",
          ],
        }),
      ),
    );

    await event.data?.after.ref.update({ contactSharedAt: Date.now() });
  },
);

export const onWatcherAdded = onDocumentCreated(
  "events/{eventId}/watchers/{watcherId}",
  async (event) => {
    await recount(event.params.eventId);
  },
);

/**
 * Retention. Every night, delete participant data for events whose retention
 * window has passed. The event itself and its final counts stay in the
 * organizer history.
 */
export const cleanupExpiredEvents = onSchedule("every day 03:00", async () => {
  const now = Date.now();
  const events = await db.collection("events").get();

  for (const eventDoc of events.docs) {
    const endDate = eventDoc.get("endDate") as string | null;
    const retentionDays = (eventDoc.get("retentionDays") as number) ?? 30;
    const purgedAt = eventDoc.get("purgedAt") as number | undefined;
    if (!endDate || purgedAt) continue;

    const expiresAt = new Date(endDate).getTime() + retentionDays * 86400000;
    if (expiresAt > now) continue;

    // Uploaded photos go with the profiles they belong to.
    try {
      await getStorage()
        .bucket()
        .deleteFiles({ prefix: `events/${eventDoc.id}/participants/` });
    } catch (error) {
      console.error("Could not delete photos for", eventDoc.id, error);
    }

    for (const sub of ["participants", "watchers", "connections"]) {
      const docs = await eventDoc.ref.collection(sub).get();
      let batch = db.batch();
      let count = 0;
      for (const d of docs.docs) {
        batch.delete(d.ref);
        count += 1;
        if (count === 400) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      if (count) await batch.commit();
    }

    await eventDoc.ref.update({
      status: "closed",
      purgedAt: now,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
});
