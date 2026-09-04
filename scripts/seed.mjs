/**
 * Seeds the local Firestore emulator with one event and a handful of
 * participants so you can click through the whole flow without real data.
 *
 *   npx firebase emulators:start
 *   node scripts/seed.mjs
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.GCLOUD_PROJECT ??= "demo-pairspace";

initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = getFirestore();

const now = Date.now();
const eventId = "seed-acro-weekend";
const slug = "acro-weekend-berlin-demo1";

const categories = [
  { id: "base", label: "Base", matchesWith: ["flyer", "both"] },
  { id: "flyer", label: "Flyer", matchesWith: ["base", "both"] },
  { id: "both", label: "Both", matchesWith: ["base", "flyer", "both"] },
];

const questions = [
  {
    id: "level",
    label: "Experience level",
    type: "single",
    options: ["Beginner", "Improver", "Intermediate", "Advanced"],
    required: true,
    usedForMatching: true,
  },
  {
    id: "availability",
    label: "Availability",
    type: "multi",
    options: ["Friday", "Saturday", "Sunday", "Full weekend"],
    required: false,
    usedForMatching: true,
  },
];

const people = [
  { firstName: "Maya", categoryIds: ["flyer"], lookingForIds: ["base"], level: "Intermediate" },
  { firstName: "Leo", categoryIds: ["base"], lookingForIds: ["flyer"], level: "Intermediate" },
  { firstName: "Sara", categoryIds: ["flyer"], lookingForIds: ["base", "both"], level: "Improver" },
  { firstName: "Ibrahim", categoryIds: ["base"], lookingForIds: ["flyer"], level: "Advanced" },
  { firstName: "Yuki", categoryIds: ["both"], lookingForIds: ["base", "flyer"], level: "Intermediate" },
];

await db.doc(`slugs/${slug}`).set({ eventId, ownerUid: "seed-owner", createdAt: now });

await db.doc(`events/${eventId}`).set({
  id: eventId,
  slug,
  ownerUid: "seed-owner",
  name: "Acro Weekend Berlin",
  location: "Berlin, Germany",
  startDate: "2026-10-16",
  endDate: "2026-10-18",
  description:
    "Two days of acro jams, workshops and open practice. Find someone to train with before you arrive.",
  categories,
  questions,
  visibility: "participants",
  allowPhotos: true,
  requirePhotos: false,
  status: "live",
  retentionDays: 30,
  createdAt: now,
  updatedAt: now,
  counts: { participants: people.length, watchers: 2, connections: 1, openForPartner: people.length },
});

for (const [i, p] of people.entries()) {
  const id = `seed-participant-${i}`;
  await db.doc(`events/${eventId}/participants/${id}`).set({
    id,
    eventId,
    uid: `seed-uid-${i}`,
    firstName: p.firstName,
    categoryIds: p.categoryIds,
    lookingForIds: p.lookingForIds,
    answers: [
      { questionId: "level", value: p.level },
      { questionId: "availability", value: ["Full weekend"] },
    ],
    note: "",
    photoUrl: null,
    photoPath: null,
    contactMethods: i % 3 === 2 ? ["link"] : i % 3 === 1 ? ["whatsapp"] : ["email"],
    open: true,
    notifyOnMatch: true,
    createdAt: now - i * 60000,
    updatedAt: now,
    editToken: `seedtoken${i}`,
  });
  // Contact details live in the private subcollection, never on the profile.
  await db.doc(`events/${eventId}/participants/${id}/private/contact`).set({
    uid: `seed-uid-${i}`,
    email: i % 3 === 0 ? `${p.firstName.toLowerCase()}@example.com` : "",
    phone: i % 3 === 1 ? `+49 170 000000${i}` : "",
    updatedAt: now,
  });
}

console.log(`Seeded. Open http://localhost:3000/e/${slug}`);
