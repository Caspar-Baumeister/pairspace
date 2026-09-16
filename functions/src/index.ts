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

const SITE = process.env.SITE_URL ?? "https://joinpairspace.com";

function eventLink(slug: string): string {
  return `${SITE}/e/${slug}`;
}

type Snapshot = FirebaseFirestore.DocumentSnapshot;

interface Contact {
  email: string;
  phone: string;
}

/**
 * Contact details of a participant. They live in the private subcollection.
 * Profiles created before that existed still carry an email on the public
 * document, so fall back to it until the person saves their profile again.
 */
async function contactOf(participant: Snapshot): Promise<Contact> {
  const priv = await participant.ref.collection("private").doc("contact").get();
  if (priv.exists) {
    return {
      email: ((priv.get("email") as string | undefined) ?? "").trim(),
      phone: ((priv.get("phone") as string | undefined) ?? "").trim(),
    };
  }
  return { email: ((participant.get("email") as string | undefined) ?? "").trim(), phone: "" };
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
    const joinedAs = joinedCategories.map(categoryLabel).join(" and ");

    /* Watchers who wanted this category. */
    const watchers = await db.collection(`events/${eventId}/watchers`).get();
    const matchingWatchers = watchers.docs.filter((doc) => {
      const wants: string[] = doc.get("lookingForIds") ?? [];
      if (doc.get("notifiedAt")) return false;
      return wants.length === 0 || wants.some((w) => joinedCategories.includes(w));
    });

    await Promise.all(
      matchingWatchers.map(async (doc) => {
        const sent = await send({
          to: doc.get("email") as string,
          subject: `A matching participant joined ${eventData.name}`,
          heading: "Someone matching just joined",
          body: [
            `${joined.firstName} joined <strong>${eventData.name}</strong> as ${joinedAs}.`,
            "Open the event to see the profile and send a request.",
          ],
          cta: { label: "See who joined", url: link },
        });
        if (sent) await doc.ref.update({ notifiedAt: Date.now() });
      }),
    );

    /* Participants who asked to hear about new matches. */
    const others = await db
      .collection(`events/${eventId}/participants`)
      .where("notifyOnMatch", "==", true)
      .get();

    const interested = others.docs
      .filter((doc) => doc.id !== event.params.participantId && doc.get("open") === true)
      .filter((doc) => {
        const wants: string[] = doc.get("lookingForIds") ?? [];
        return wants.some((w) => joinedCategories.includes(w));
      });

    await Promise.all(
      interested.map(async (doc) => {
        const { email } = await contactOf(doc);
        if (!email) return;
        await send({
          to: email,
          subject: `${joined.firstName} matches your search at ${eventData.name}`,
          heading: `${joined.firstName} matches your search`,
          body: [
            `${joined.firstName} joined as ${joinedAs}.`,
            "You can send a request from the event page. Your contact details stay hidden until you both agree.",
          ],
          cta: { label: "Open the event", url: link },
        });
      }),
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

/**
 * A participant asked someone to pair up. Notify the receiver by email when
 * they left one. People who chose the link only see the request on the page.
 */
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

    const { email } = await contactOf(toSnap);
    if (!email) {
      console.log("[request] receiver has no email, request waits on the event page", {
        eventId,
        to: toSnap.id,
      });
      return;
    }

    await send({
      to: email,
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

function describeContact(contact: Contact): string {
  const parts: string[] = [];
  if (contact.email) {
    parts.push(`by email at <a href="mailto:${contact.email}" style="color:#0d8a5e">${contact.email}</a>`);
  }
  if (contact.phone) {
    const digits = contact.phone.replace(/[^\d]/g, "");
    parts.push(
      `on WhatsApp or by phone at <a href="https://wa.me/${digits}" style="color:#0d8a5e">${contact.phone}</a>`,
    );
  }
  return parts.join(" or ");
}

/**
 * The request was accepted. This is the only moment contact details leave the
 * private collection. They go to exactly one person who agreed to receive
 * them: into that person's private shared document, so they can be read on
 * the event page, and by email when the person left an address.
 */
export const onConnectionAnswered = onDocumentUpdated(
  { document: "events/{eventId}/connections/{connectionId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const { eventId, connectionId } = event.params;
    await recount(eventId);

    if (after.status !== "accepted") return;

    const [eventSnap, fromSnap, toSnap] = await Promise.all([
      db.doc(`events/${eventId}`).get(),
      db.doc(`events/${eventId}/participants/${after.fromParticipantId}`).get(),
      db.doc(`events/${eventId}/participants/${after.toParticipantId}`).get(),
    ]);
    if (!fromSnap.exists || !toSnap.exists) return;

    const eventName = eventSnap.get("name") as string;
    const link = eventLink(eventSnap.get("slug") as string);
    const [fromContact, toContact] = await Promise.all([contactOf(fromSnap), contactOf(toSnap)]);
    const sharedAt = Date.now();

    const pairs: [Snapshot, Contact, Snapshot, Contact][] = [
      [fromSnap, fromContact, toSnap, toContact],
      [toSnap, toContact, fromSnap, fromContact],
    ];

    await Promise.all(
      pairs.map(async ([recipient, recipientContact, other, otherContact]) => {
        // Release the other person's details into the recipient's private area.
        await recipient.ref
          .collection("private")
          .doc("shared")
          .set(
            {
              uid: recipient.get("uid"),
              updatedAt: sharedAt,
              contacts: {
                [other.id]: {
                  participantId: other.id,
                  connectionId,
                  firstName: other.get("firstName"),
                  email: otherContact.email,
                  phone: otherContact.phone,
                  sharedAt,
                },
              },
            },
            { merge: true },
          );

        if (!recipientContact.email) return;

        const how = describeContact(otherContact);
        await send({
          to: recipientContact.email,
          subject: `You are paired up at ${eventName}`,
          heading: "You are paired up",
          body: [
            `${other.get("firstName")} agreed to pair up with you at <strong>${eventName}</strong>.`,
            how
              ? `You can reach them ${how}.`
              : `${other.get("firstName")} did not leave contact details and will find you through the event page. You can see the connection there any time.`,
            "These details were shared because you both agreed. Nobody else at the event can see them.",
          ],
          cta: { label: "Open the event", url: link },
        });
      }),
    );

    await event.data?.after.ref.update({ contactSharedAt: sharedAt });
  },
);

export const onWatcherAdded = onDocumentCreated(
  "events/{eventId}/watchers/{watcherId}",
  async (event) => {
    await recount(event.params.eventId);
  },
);

/**
 * Product feedback. Every entry goes straight to the maker's inbox, so
 * nobody has to remember to look into Firestore.
 */
const FEEDBACK_TO = process.env.FEEDBACK_TO ?? "caspar.baumeister.privat@gmail.com";

export const onFeedbackCreated = onDocumentCreated(
  { document: "feedback/{feedbackId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const moment: Record<string, string> = {
      joined: "right after creating a profile",
      matched: "after the first accepted connection",
      later: "from the feedback link",
    };
    const mood: Record<string, string> = {
      loved: "Loved it",
      okay: "It was okay",
      off: "Something was off",
    };
    const text = String(data.text ?? "").trim();
    const eventSnap = await db.collection("events").doc(String(data.eventId)).get();
    const slug = eventSnap.get("slug") as string | undefined;
    const body = [
      `<strong>${escapeHtml(String(data.eventName ?? "Unknown event"))}</strong>, ${moment[String(data.moment)] ?? String(data.moment)}.`,
      `Mood: ${data.mood ? (mood[String(data.mood)] ?? String(data.mood)) : "not given"}.`,
      text ? `"${escapeHtml(text).replace(/\n/g, "<br>")}"` : "No text, just the mood.",
      data.email
        ? `You may write back: <a href="mailto:${escapeHtml(String(data.email))}">${escapeHtml(String(data.email))}</a>`
        : "No contact given.",
    ];
    await send({
      to: FEEDBACK_TO,
      subject: `Feedback: ${String(data.eventName ?? "event")} (${String(data.moment)})`,
      heading: "A participant left feedback",
      body,
      cta: slug ? { label: "Open the event", url: eventLink(slug) } : undefined,
      footer: "Internal Pairspace notification.",
    });
  },
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

    // Recursive, so the private contact documents under each participant go too.
    for (const sub of ["participants", "watchers", "connections"]) {
      await db.recursiveDelete(eventDoc.ref.collection(sub));
    }

    await eventDoc.ref.update({
      status: "closed",
      purgedAt: now,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
});
