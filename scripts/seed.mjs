/**
 * Fills the local emulators with one demo landlord, one live flat with three
 * rooms and fourteen applicants who already rated each other.
 *
 *   npm run emulators        in one terminal
 *   npm run seed             in another
 *
 * Sign in at /anmelden with demo@pairspace.test and the password pairspace.
 * Refuses to run unless the emulator hosts are set, so it can never write to
 * the live project.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("Emulator hosts missing. Run with: npm run seed");
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "pairspace-live";
initializeApp({ projectId });
const db = getFirestore();
const auth = getAuth();

const DAY = 86_400_000;
const now = Date.now();
const FLAT_ID = "demo2wg8";

let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (list) => list[Math.floor(rand() * list.length)];

const room = (id) => `https://images.unsplash.com/photo-${id}?w=1400&q=70&auto=format&fit=crop`;
const face = (id) => `https://images.unsplash.com/photo-${id}?w=900&h=1125&q=70&auto=format&fit=crop&crop=faces`;

/* ------------------------------------------------------------- landlord */

const EMAIL = "demo@pairspace.test";
let uid;
try {
  uid = (await auth.getUserByEmail(EMAIL)).uid;
} catch {
  uid = (await auth.createUser({ email: EMAIL, password: "pairspace", displayName: "Caspar" })).uid;
}

await db.doc(`landlords/${uid}`).set({
  uid,
  name: "Caspar",
  email: EMAIL,
  about: "Ich vermiete die Zimmer selbst und wohne zwei Straßen weiter. Mir ist wichtig, dass ihr euch versteht.",
  photo: null,
  createdAt: now - 10 * DAY,
  updatedAt: now,
  subscription: {
    plan: "basic",
    interval: "month",
    status: "trialing",
    trialEndsAt: now + 5 * DAY,
    currentPeriodEnd: now + 5 * DAY,
    provider: "prototype",
  },
});

/* ----------------------------------------------------------------- flat */

const rooms = [
  {
    id: "r-gross",
    name: "Großes Zimmer mit Balkon",
    rent: 720,
    size: 22,
    photo: { url: room("1522708323590-d24dbb6b0267"), path: "" },
    availableFrom: "2026-12-01",
    note: "Südseite, Altbau mit Stuck, eigener Zugang zum Balkon.",
  },
  {
    id: "r-mittel",
    name: "Helles Eckzimmer",
    rent: 610,
    size: 17,
    photo: { url: room("1540518614846-7eded433c457"), path: "" },
    availableFrom: "2026-12-01",
    note: "Zwei Fenster, ruhig zum Hof.",
  },
  {
    id: "r-klein",
    name: "Kleines Zimmer",
    rent: 490,
    size: 12,
    photo: { url: room("1505693416388-ac5ce068fe85"), path: "" },
    availableFrom: "2027-01-01",
    note: "Kompakt, aber mit Hochbett und viel Stauraum.",
  },
];

await db.doc(`flats/${FLAT_ID}`).set({
  id: FLAT_ID,
  ownerUid: uid,
  title: "3er WG Weserstraße",
  city: "Berlin",
  district: "Neukölln",
  description: "Komplett möblierte Altbau WG, 85 m², große Wohnküche, Waschmaschine, Glasfaser. Fünf Minuten zur U7.",
  host: {
    name: "Caspar",
    about: "Ich vermiete die Zimmer selbst und wohne zwei Straßen weiter. Mir ist wichtig, dass ihr euch versteht.",
    photoUrl: null,
  },
  rooms,
  status: "live",
  createdAt: now - 9 * DAY,
  updatedAt: now,
});

/* ----------------------------------------------------------- applicants */

// Three camps that like each other, plus two outliers. Votes follow the
// camps with some noise, so the graph shows clusters without being perfect.
const people = [
  // camp: social students
  ["lena", "Lena", 23, "Medizinstudium", "f", "1494790108377-be9c29b29330", "social", ["Kochen", "Festivals", "Yoga", "Reisen"], "together", "flexible", "normal"],
  ["jonas", "Jonas", 24, "Maschinenbau Master", "m", "1500648767791-00dcc994a43e", "social", ["Fahrrad", "Brettspiele", "Kochen"], "together", "night", "relaxed"],
  ["mia", "Mia", 22, "Soziale Arbeit", "f", "1438761681033-6461ffad8d80", "social", ["Tanzen", "Konzerte", "Vegetarisch"], "together", "night", "normal"],
  ["paul", "Paul", 25, "Lehramt Sport und Bio", "m", "1507003211169-0a1dd7228f2d", "social", ["Sport", "Laufen", "Feiern"], "mixed", "early", "normal"],
  ["sophie", "Sophie", 23, "Psychologie", "f", "1534528741775-53994a69daeb", "social", ["Lesen", "Kaffee", "Pflanzen", "Yoga"], "together", "flexible", "tidy"],
  // camp: calm professionals
  ["felix", "Felix", 31, "Software Entwickler", "m", "1506794778202-cad84cf45f1d", "calm", ["Tech", "Klettern", "Kaffee"], "solo", "early", "tidy"],
  ["hannah", "Hannah", 29, "Ärztin im Praktikum", "f", "1544005313-94ddf0286df2", "calm", ["Laufen", "Lesen", "Wein"], "mixed", "early", "tidy"],
  ["david", "David", 33, "Projektmanager", "m", "1519085360753-af0119f7cbe7", "calm", ["Wandern", "Kochen", "Politik"], "solo", "early", "tidy"],
  ["clara", "Clara", 28, "Architektin", "f", "1573496359142-b8d87734a5a2", "calm", ["Kunst", "Fotografie", "Wein"], "mixed", "flexible", "tidy"],
  // camp: creatives
  ["noah", "Noah", 27, "Musiker und Barista", "m", "1539571696357-5a69c17a67c6", "creative", ["Musik", "Konzerte", "Kaffee"], "mixed", "night", "relaxed"],
  ["emma", "Emma", 26, "Illustratorin", "f", "1524504388940-b1c1722653e1", "creative", ["Kunst", "Kino", "Pflanzen"], "mixed", "night", "normal"],
  ["luis", "Luis", 25, "Filmstudium", "m", "1531427186611-ecfd6d936c79", "creative", ["Kino", "Fotografie", "Serien"], "together", "night", "relaxed"],
  // outliers
  ["max", "Max", 30, "Vertrieb", "m", "1472099645785-5658abf4ff4e", "outlier", ["Feiern", "Fußball", "Gaming"], "together", "night", "relaxed"],
  ["sara", "Sara", 24, "Pharmazie", "f", "1580489944761-15a19d654956", "new", ["Kochen", "Reisen"], "mixed", "flexible", "normal"],
];

// How a camp feels about another camp, on the five step scale.
const mood = {
  social: { social: 1.25, calm: -0.6, creative: 0.5, outlier: -0.5, new: 0.3 },
  calm: { social: -0.7, calm: 1.2, creative: -0.2, outlier: -1.4, new: 0.4 },
  creative: { social: 0.4, calm: -0.3, creative: 1.35, outlier: 0.2, new: 0.2 },
  outlier: { social: 1.8, calm: 1.5, creative: 1.5, outlier: 0, new: 1.8 },
};

const roomTaste = {
  social: ["r-klein", "r-mittel", "r-gross"],
  calm: ["r-gross", "r-mittel", "r-klein"],
  creative: ["r-mittel", "r-gross", "r-klein"],
  outlier: ["r-gross", "r-mittel", "r-klein"],
};

const bios = {
  lena: "Ich koche gerne für alle und freue mich auf eine WG, in der man abends zusammen am Küchentisch sitzt.",
  jonas: "Meistens in der Uni oder auf dem Rad. Spieleabende sind mein Ding, Abwasch auch, versprochen.",
  mia: "Offen, laut lachend, gerne unterwegs. Ich suche eine WG, die mehr ist als eine Zweck WG.",
  paul: "Morgens laufen, abends Sport, dazwischen Uni. Ich bin unkompliziert und hilfsbereit.",
  sophie: "Viele Pflanzen, guter Kaffee und Bücher. Ich mag es ordentlich, aber nicht steril.",
  felix: "Ich arbeite viel remote und schätze Ruhe unter der Woche. Am Wochenende gerne gemeinsam kochen.",
  hannah: "Schichtdienst im Krankenhaus, deshalb schlafe ich manchmal tagsüber. Ruhige, rücksichtsvolle WG gesucht.",
  david: "Strukturiert, freundlich, eher ruhig. Putzplan finde ich gut.",
  clara: "Ich zeichne viel und bin oft im Büro. Gerne ein Glas Wein in der Küche, aber kein Partyhaus.",
  noah: "Ich spiele Gitarre (mit Kopfhörern, keine Sorge) und mache den besten Flat White der Stadt.",
  emma: "Ich arbeite von zu Hause an Illustrationen und brauche Licht. Filmabende jederzeit.",
  luis: "Film, Fotos, Serien. Ich bin eher spät wach und eher entspannt.",
  max: "Für jeden Spaß zu haben! Wochenende ist Party, unter der Woche auch manchmal.",
  sara: "Gerade für den Master nach Berlin gezogen und neugierig auf alles.",
};

const toVote = (x) => (x <= -1.6 ? -2 : x < -0.5 ? -1 : x < 0.5 ? 0 : x < 1.4 ? 1 : 2);

const batch = db.batch();
const applicants = people.map(([id, firstName, age, occupation, , photo, camp, interests, flatLife, rhythm, cleanliness], i) => {
  const applicant = {
    uid: `demo-${id}`,
    firstName,
    age,
    occupation,
    bio: bios[id],
    photos: [{ url: face(photo), path: "" }],
    interests: interests.filter((t) => t !== "Fußball"),
    languages: i % 3 === 0 ? ["Deutsch", "Englisch", "Spanisch"] : ["Deutsch", "Englisch"],
    lifestyle: {
      cleanliness,
      flatLife,
      rhythm,
      smoker: id === "max" || id === "noah",
      pets: false,
    },
    moveIn: pick(["2026-12-01", "2026-12-15", "2027-01-01"]),
    stay: pick(["medium", "long", "long"]),
    status: "complete",
    createdAt: now - (9 - i * 0.6) * DAY,
    updatedAt: now - (9 - i * 0.6) * DAY,
  };
  batch.set(db.doc(`flats/${FLAT_ID}/applicants/${applicant.uid}`), applicant);
  batch.set(db.doc(`flats/${FLAT_ID}/applicants/${applicant.uid}/private/contact`), {
    email: `${id}@example.com`,
    phone: rand() < 0.5 ? `0151 ${Math.floor(1000000 + rand() * 8999999)}` : "",
    notify: true,
    updatedAt: now,
  });
  return { ...applicant, camp, id };
});

for (const a of applicants) {
  // Sara just joined: she has not rated anyone and nobody rated her yet.
  if (a.camp === "new") continue;
  const votes = {};
  for (const b of applicants) {
    if (a === b || b.camp === "new") continue;
    if (rand() < 0.12) continue;
    let x = mood[a.camp][b.camp] + (rand() - 0.5) * 1.8;
    // Two people really do not want to live with Max.
    if (b.id === "max" && (a.id === "hannah" || a.id === "david")) x = -2;
    votes[b.uid] = toVote(x);
  }
  const order = [...roomTaste[a.camp]];
  if (rand() < 0.3) order.reverse();
  const roomRanks = {};
  order.forEach((r, i) => (roomRanks[r] = i + 1));
  // Some people like two rooms equally.
  if (rand() < 0.25) roomRanks[order[1]] = 1;
  batch.set(db.doc(`flats/${FLAT_ID}/ballots/${a.uid}`), { uid: a.uid, votes, roomRanks, updatedAt: now });
}

await batch.commit();

console.log(`Seeded flat ${FLAT_ID} with ${applicants.length} applicants.`);
console.log(`Landlord:  http://localhost:3000/anmelden  ${EMAIL} / pairspace`);
console.log(`Applicant: http://localhost:3000/w/${FLAT_ID}`);
