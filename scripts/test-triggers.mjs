/**
 * Runs the handlers behind the Cloud Functions against the local emulators,
 * the way the triggers would call them. Mail lands in devOutbox, nothing is
 * sent. Uses its own throwaway flat and removes it afterwards.
 *
 *   npm run emulators                  in one terminal
 *   npm run dev                        for the /api/vertrag checks (skipped without it)
 *   cd functions && npm run test:triggers
 */
import { createRequire } from "node:module";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";
process.env.GCLOUD_PROJECT ??= "pairspace-live";
for (const key of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(process.env[key])) {
    console.error(`${key} must point to a local emulator.`);
    process.exit(1);
  }
}

const require = createRequire(import.meta.url);
const { db, auth, bucket } = require("../functions/lib/admin.js");
const { handleApplicantWritten, markerRef, DAY_MS } = require("../functions/lib/notify.js");
const { handleApplicantDeleted, handleFlatDeleted } = require("../functions/lib/cleanup.js");
const { unsubscribe } = require("../functions/lib/index.js");
const { handleContractRequest, handleContractCreated, CASPAR, requestRef, contractRef } = require("../functions/lib/contracts.js");
const { agbDoc } = require("../functions/lib/shared/agb.js");
const { widerrufDoc } = require("../functions/lib/shared/widerruf.js");
const { formatDate, formatDateTime } = require("../functions/lib/shared/contract.js");
const { euro } = require("../functions/lib/shared/plan.js");
const express = createRequire(new URL("../functions/package.json", import.meta.url))("express");

const run = Math.random().toString(36).slice(2, 8);
const FLAT = `trg${run}`;
const mail = (who) => `${who}-${run}@pairspace.test`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = true;
function check(name, got, want) {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  ok &&= pass;
  console.log(`${pass ? "ok  " : "FAIL"} ${name}: ${JSON.stringify(got)}${pass ? "" : ` (erwartet ${JSON.stringify(want)})`}`);
}

async function outbox() {
  const snap = await db().collection("devOutbox").where("to", ">=", "").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m) => String(m.to).endsWith(`-${run}@pairspace.test`));
}
const files = async (prefix) => (await bucket().getFiles({ prefix }))[0].map((f) => f.name.slice(prefix.length)).sort();
const photo = (path) => bucket().file(path).save(Buffer.from("webp"), { contentType: "image/webp" });

/* ---------------------------------------------------------------- setup */

const owner = await auth().createUser({ email: mail("landlord"), password: "pairspace" });
await db().doc(`landlords/${owner.uid}`).set({ uid: owner.uid, name: "Test", email: null, locale: "en" });
await db().doc(`flats/${FLAT}`).set({ id: FLAT, ownerUid: owner.uid, title: "Altbau Kreuzberg", status: "live", rooms: [] });

const profile = (uid, firstName, extra = {}) => ({
  uid,
  firstName,
  age: 27,
  occupation: "UX Designerin",
  bio: "",
  photos: [],
  status: "complete",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...extra,
});
async function applicant(uid, firstName, contact, votes = {}, extra = {}) {
  const data = profile(uid, firstName, extra);
  await db().doc(`flats/${FLAT}/applicants/${uid}`).set(data);
  if (contact) await db().doc(`flats/${FLAT}/applicants/${uid}/private/contact`).set({ phone: "", updatedAt: Date.now(), ...contact });
  await db().doc(`flats/${FLAT}/ballots/${uid}`).set({ uid, votes, roomRanks: {}, updatedAt: Date.now() });
  return data;
}

await applicant("a", "Anna", { email: mail("a"), notify: true, locale: "de" }, { b: 1, d: 2 });
await applicant("b", "Ben", { email: mail("b"), notify: true, locale: "en" }, { a: 1, d: -1 });
await applicant("c", "Cem", { email: mail("c"), notify: false }, { a: 1, d: 0 });
await applicant("q", "Quentin", { email: mail("q"), notify: true }, {}, { status: "draft" });
await photo(`flats/${FLAT}/applicants/d/one.webp`);
await photo(`flats/${FLAT}/applicants/d/two.webp`);
const d = await applicant("d", "Dana", { email: mail("d"), notify: true, locale: "de" }, { a: 1, b: 2 });

/* ------------------------------------------------------- landlord mail once */

console.log("\nNeue Bewerberin Dana");
check("Dana komplett: Vermieter und wer notify an hat", await handleApplicantWritten(FLAT, "d", d), { landlord: true, notified: ["a", "b"] });
let box = await outbox();
const landlordMail = box.find((m) => m.template === "landlord-new-applicant");
check("Vermieter-Mail an die Adresse aus Auth", landlordMail?.to, mail("landlord"));
check("Vermieter-Mail auf Englisch (landlords.locale)", landlordMail?.subject, "New application for Altbau Kreuzberg: Dana");
check("Vermieter-Mail verlinkt den Graphen", landlordMail?.text.includes(`https://joinpairspace.com/en/app/w/${FLAT}`), true);
check("Vermieter-Mail zählt die Bewerbungen", landlordMail?.text.includes("Altbau Kreuzberg now has 4 applications."), true);
check("Anna bekommt Deutsch", box.find((m) => m.to === mail("a"))?.subject, "Neue Leute für Altbau Kreuzberg");
check("Ben bekommt Englisch", box.find((m) => m.to === mail("b"))?.subject, "New people for Altbau Kreuzberg");
check("Jede Bewerber-Mail sagt, wie man abschaltet", box.filter((m) => m.template === "applicant-new-people").every((m) => /Mail bei neuen Mitbewerbern|Email me about new applicants/.test(m.text)), true);
check("Cem (notify aus) und Quentin (Entwurf) bekommen nichts", box.filter((m) => [mail("c"), mail("q")].includes(m.to)).length, 0);

console.log("\nRetry und spätere Bearbeitung");
check("Gleiches Event nochmal", await handleApplicantWritten(FLAT, "d", d), { landlord: false, notified: [] });
await db().doc(`flats/${FLAT}/applicants/d`).update({ occupation: "Product Designerin" });
check("Profil bearbeitet", await handleApplicantWritten(FLAT, "d", { ...d, occupation: "Product Designerin" }), { landlord: false, notified: [] });
check("Keine weitere Mail im Outbox", (await outbox()).length, box.length);

/* ------------------------------------------------------------ throttle 24 h */

console.log("\nEmil kommt eine Stunde später (zwei Events gleichzeitig)");
const e = await applicant("e", "Emil", { email: mail("e"), notify: true, locale: "en" });
const [e1, e2] = await Promise.all([handleApplicantWritten(FLAT, "e", e), handleApplicantWritten(FLAT, "e", e)]);
check("Genau ein Durchlauf schickt", [e1.landlord, e2.landlord].filter(Boolean).length, 1);
check("Anna und Ben gedrosselt, nur Dana bekommt Post", [...e1.notified, ...e2.notified], ["d"]);
box = await outbox();
check("Vermieter-Mails insgesamt", box.filter((m) => m.template === "landlord-new-applicant").length, 2);
check("Anna hat weiter genau eine Mail", box.filter((m) => m.to === mail("a")).length, 1);

console.log("\nFrida kommt 25 Stunden nach Annas letzter Mail");
await markerRef(FLAT, "a").update({ lastNotifiedAt: Date.now() - DAY_MS - 3_600_000 });
const f = await applicant("f", "Frida", null);
check("Anna wieder dran, Ben und Dana noch gedrosselt, Emil zum ersten Mal", (await handleApplicantWritten(FLAT, "f", f)).notified, ["a", "e"]);

/* -------------------------------------------------------------- unsubscribe */

console.log("\nBen meldet sich über den Link in der Mail ab");
const benMail = (await outbox()).find((m) => m.to === mail("b"));
const listHeader = benMail?.headers?.["List-Unsubscribe"] ?? "";
const link = new URL(listHeader.slice(1, -1));
check("List-Unsubscribe zeigt auf die Function", `${link.origin}${link.pathname}`, "https://europe-west1-pairspace-live.cloudfunctions.net/unsubscribe");
check("List-Unsubscribe-Post", benMail?.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
check("Link für Wohnung und Person", [link.searchParams.get("f"), link.searchParams.get("u"), (link.searchParams.get("s") ?? "").length], [FLAT, "b", 43]);
check("Link im HTML-Footer", benMail?.html.includes(`href="${link.href.replaceAll("&", "&amp;")}"`), true);
check("Link im Text der Mail", benMail?.text.includes(link.href), true);
check("Abmelde-Link auch in Annas deutscher Mail", (await outbox()).find((m) => m.to === mail("a"))?.text.includes("Hier mit einem Klick abmelden: https://europe-west1-pairspace-live.cloudfunctions.net/unsubscribe?"), true);

// The exported onRequest function behind a local express server, parsed like in Cloud Functions.
const server = express().use(express.urlencoded({ extended: true })).all("/unsubscribe", unsubscribe).listen(0);
const local = (params) => `http://127.0.0.1:${server.address().port}/unsubscribe?${new URLSearchParams(params)}`;
const oneClick = (params) =>
  fetch(local(params), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
const benNotify = async () => (await db().doc(`flats/${FLAT}/applicants/b/private/contact`).get()).get("notify");
const good = Object.fromEntries(link.searchParams);
const s = good.s;
const tampered = { ...good, s: (s[0] === "A" ? "B" : "A") + s.slice(1) };

const view = await fetch(local(good));
const viewHtml = await view.text();
check("GET zeigt die Seite mit Knopf", [view.status, viewHtml.includes('<form method="post"'), viewHtml.includes("Abmelden")], [200, true, true]);
check("GET allein ändert nichts", await benNotify(), true);
const bad = await oneClick(tampered);
const badHtml = await bad.text();
check("Falsche Signatur", bad.status, 403);
check("verrät keinen Grund", /signatur|signature|hmac|ungültig|invalid/i.test(badHtml), false);
check("Annas Signatur für Ben", (await oneClick({ ...good, s: new URL((await outbox()).find((m) => m.to === mail("a")).headers["List-Unsubscribe"].slice(1, -1)).searchParams.get("s") })).status, 403);
check("Ohne Signatur", (await oneClick({ f: FLAT, u: "b" })).status, 403);
check("Pfad im uid", (await oneClick({ ...good, u: "b/private/contact" })).status, 403);
check("Nach den falschen Versuchen noch an", await benNotify(), true);
const done = await oneClick(good);
check("One-Click-POST mit echter Signatur", [done.status, (await done.text()).includes("Erledigt")], [200, true]);
check("notify ist aus", await benNotify(), false);
check("Zweiter Klick schadet nicht", (await oneClick(good)).status, 200);
server.close();

console.log("\nHanna kommt, Bens 24 Stunden sind um");
await markerRef(FLAT, "b").update({ lastNotifiedAt: Date.now() - DAY_MS - 3_600_000 });
const h = await applicant("h", "Hanna", null);
check("Ben bekommt nichts mehr, alle anderen noch gedrosselt", (await handleApplicantWritten(FLAT, "h", h)).notified, []);

console.log("\nEntwurf");
const g = await applicant("g", "Gustav", null, {}, { status: "draft" });
check("Entwurf löst nichts aus", await handleApplicantWritten(FLAT, "g", g), { landlord: false, notified: [] });
check("und legt keinen Vermerk an", (await markerRef(FLAT, "g").get()).exists, false);

/* ----------------------------------------------------------------- deletion */

console.log("\nDana löscht ihre Bewerbung");
await db().doc(`flats/${FLAT}/applicants/d`).delete();
const dReport = await handleApplicantDeleted(FLAT, "d", Date.now());
check("Bericht", dReport, { photos: 2, subdocs: 2, ballot: true, ratingsRemoved: 3 });
check("Fotos in Storage", await files(`flats/${FLAT}/applicants/d/`), []);
check("private/contact", (await db().doc(`flats/${FLAT}/applicants/d/private/contact`).get()).exists, false);
check("server/mail", (await markerRef(FLAT, "d").get()).exists, false);
check("Ihr Stimmzettel", (await db().doc(`flats/${FLAT}/ballots/d`).get()).exists, false);
const votes = Object.fromEntries(
  await Promise.all(["a", "b", "c"].map(async (u) => [u, (await db().doc(`flats/${FLAT}/ballots/${u}`).get()).get("votes")])),
);
check("Dana aus den Stimmzetteln der anderen, Rest bleibt", votes, { a: { b: 1 }, b: { a: 1 }, c: { a: 1 } });

console.log("\nEmil löscht und bewirbt sich sofort neu");
await photo(`flats/${FLAT}/applicants/e/old.webp`);
await db().doc(`flats/${FLAT}/applicants/e`).delete();
const deletedAt = Date.now();
await sleep(1100);
await photo(`flats/${FLAT}/applicants/e/new.webp`);
await db().doc(`flats/${FLAT}/applicants/e/private/contact`).set({ email: mail("e"), phone: "", notify: true, updatedAt: Date.now() });
await handleApplicantDeleted(FLAT, "e", deletedAt);
check("Altes Foto weg, neues bleibt", await files(`flats/${FLAT}/applicants/e/`), ["new.webp"]);
check("Neuer Kontakt bleibt", (await db().doc(`flats/${FLAT}/applicants/e/private/contact`).get()).exists, true);

console.log("\nVermieter löscht die Wohnung");
await photo(`flats/${FLAT}/applicants/a/one.webp`);
await photo(`landlords/${owner.uid}/flats/${FLAT}/room1-abcd.webp`);
await photo(`landlords/${owner.uid}/avatar-test.webp`);
await db().doc(`flats/${FLAT}`).delete();
const flatReport = await handleFlatDeleted(FLAT, owner.uid);
check("Keine Profile mehr", (await db().collection(`flats/${FLAT}/applicants`).get()).size, 0);
check("Keine Stimmzettel mehr", (await db().collection(`flats/${FLAT}/ballots`).get()).size, 0);
check("Keine Unterdokumente mehr", (await db().collection(`flats/${FLAT}/applicants/a/private`).get()).size, 0);
check("Keine Bewerberfotos mehr", await files(`flats/${FLAT}/`), []);
check("Keine Zimmerfotos mehr", await files(`landlords/${owner.uid}/flats/${FLAT}/`), []);
check("Vermieterfoto bleibt", await files(`landlords/${owner.uid}/`), ["avatar-test.webp"]);
check("Bericht", flatReport, { applicantFiles: 2, roomFiles: 1 });

/* ------------------------------------------- cancel and withdraw (§ 312k, § 356a) */

const SITE = process.env.TEST_SITE_URL ?? "http://localhost:3000";
// Fresh addresses each run: the rate limit lives in the dev server's memory for ten minutes.
const NET = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
const IP = `${NET}.1`;
const vertrag = (body, ip = IP) =>
  fetch(`${SITE}/api/vertrag`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip, "user-agent": `trigger-test/${run}` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const notices = async () =>
  (await db().collection("devOutbox").where("template", "==", "contract-notice").get()).docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => String(m.replyTo).endsWith(`-${run}@pairspace.test`));
const requestIds = [];
const siteUp = await fetch(`${SITE}/impressum`, { method: "HEAD" }).then((r) => r.ok).catch(() => false);

if (!siteUp) {
  console.log(`\nskip /api/vertrag: kein Dev-Server unter ${SITE} (npm run dev)`);
} else {
  console.log("\nVermieter kündigt über /kuendigen (ohne Stripe, also von Hand)");
  const cancelBody = {
    kind: "cancel",
    contract: "basic",
    name: "  Test   Vermieter ",
    email: mail("landlord").toUpperCase(),
    cancelType: "extraordinary",
    reason: "Die Wohnung ist verkauft.",
    when: "asap",
    locale: "de",
    sneaky: "wird verworfen",
  };
  const res = await vertrag(cancelBody);
  const answer = await res.json();
  check("Antwort 200 mit Eingangsnummer und Zeit, sonst nichts", [res.status, Object.keys(answer).sort()], [200, ["id", "receivedAt"]]);
  requestIds.push(answer.id);
  const rec = (await requestRef(answer.id).get()).data();
  check("Gespeichert: bereinigte Erklärung ohne fremde Felder", rec.data, {
    kind: "cancel",
    contract: "basic",
    name: "Test Vermieter",
    email: mail("landlord"),
    cancelType: "extraordinary",
    reason: "Die Wohnung ist verkauft.",
    when: "asap",
  });
  check("Konto über die Mail gefunden, ohne Abo", rec.account, { uid: owner.uid, subscriptionId: null });
  check("Ohne Stripe bleibt es Handarbeit", rec.automation, { status: "manual", reason: "no-stripe" });
  check("IP nur als Hash, Browserkennung dabei", [/^[0-9a-f]{32}$/.test(rec.ipHash), JSON.stringify(rec).includes(IP), rec.userAgent], [true, false, `trigger-test/${run}`]);
  check("Eingang stimmt mit der Antwort", rec.receivedAt, answer.receivedAt);

  check("Function: Eingangsbestätigung und Kopie an Caspar", await handleContractRequest(answer.id), { receipt: true, notice: true });
  const receipt = (await outbox()).find((m) => m.template === "contract-receipt" && m.to === mail("landlord"));
  check("Bestätigung an die Mail aus der Erklärung", receipt?.subject, "Eingangsbestätigung: deine Kündigung bei Pairspace");
  const received = formatDateTime(answer.receivedAt, "de");
  check("mit Datum und Uhrzeit des Eingangs", receipt?.text.includes(`am ${received} bei uns eingegangen`), true);
  check(
    "mit dem vollen Inhalt der Erklärung",
    ["Erklärung: Kündigung", "Vertrag: Pairspace Basic, Abo für Vermieter", "Name: Test Vermieter", `Mail: ${mail("landlord")}`, "Art der Kündigung: Außerordentlich", "Grund: Die Wohnung ist verkauft.", "Gewünschter Zeitpunkt: Nächstmöglicher Zeitpunkt"].filter((l) => !receipt?.text.includes(l)),
    [],
  );
  check("ohne Enddatum, weil von Hand", receipt?.text.includes("bestätigen dir per Mail, zu welchem Zeitpunkt"), true);
  check("Eingangsnummer im Footer", receipt?.text.includes(`Eingangsnummer ${answer.id}`), true);
  const notice = (await notices()).find((m) => m.idempotencyKey === `contract-notice/${answer.id}`);
  check("Kopie an Caspar, Antworten an die Person", [notice?.to, notice?.replyTo], [CASPAR, mail("landlord")]);
  check("Kopie nennt Konto und Aufgabe", [notice?.text.includes(`UID ${owner.uid}`), notice?.text.includes("Zu tun: Vertrag finden")], [true, true]);
  const before = (await outbox()).length + (await notices()).length;
  check("Gleiches Event nochmal", await handleContractRequest(answer.id), { receipt: false, notice: false });
  check("Keine weitere Mail", (await outbox()).length + (await notices()).length, before);

  console.log("\nWiderruf auf Englisch, Mail ohne Konto");
  const w = await vertrag({ kind: "withdraw", contract: "basic", name: "Wendy", email: mail("w"), locale: "en", cancelType: "extraordinary" });
  const wAnswer = await w.json();
  requestIds.push(wAnswer.id);
  const wRec = (await requestRef(wAnswer.id).get()).data();
  check("Widerruf speichert keine Kündigungsfelder", wRec.data, { kind: "withdraw", contract: "basic", name: "Wendy", email: mail("w") });
  check("Kein Konto, nie automatisch", [wRec.account, wRec.automation], [null, { status: "manual", reason: "withdrawal" }]);
  await handleContractRequest(wAnswer.id);
  const wMail = (await outbox()).find((m) => m.to === mail("w"));
  check("Englische Bestätigung", wMail?.subject, "Receipt: your withdrawal at Pairspace");
  check("mit Zeit und anteiliger Erstattung", [wMail?.text.includes(formatDateTime(wAnswer.receivedAt, "en")), wMail?.text.includes("within 14 days")], [true, true]);
  check("Caspar soll erstatten", (await notices()).find((m) => m.replyTo === mail("w"))?.text.includes("anteilig erstatten"), true);

  console.log("\nFalsche Eingaben");
  check("Ungültige Mail", (await (await vertrag({ ...cancelBody, email: "kein-at" }, `${NET}.2`)).json()).error, "email");
  check("Kein Name", (await (await vertrag({ ...cancelBody, name: "   " }, `${NET}.2`)).json()).error, "name");
  check("Datum, das es nicht gibt", (await (await vertrag({ ...cancelBody, when: "date", date: "2026-02-30" }, `${NET}.2`)).json()).error, "date");
  check("Fremder Vertrag", (await (await vertrag({ ...cancelBody, contract: "premium" }, `${NET}.3`)).json()).error, "contract");
  check("Zu groß", (await vertrag({ ...cancelBody, reason: "x".repeat(9000) }, `${NET}.3`)).status, 413);
  check("Kaputtes JSON", (await vertrag("{", `${NET}.3`)).status, 400);

  console.log("\nZu viele Versuche von einer Adresse");
  const burstIp = `${NET}.4`;
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await vertrag({ ...cancelBody, email: "kein-at" }, burstIp)).status);
  check("Fünf gehen durch, der sechste nicht", statuses, [400, 400, 400, 400, 400, 429]);
}

console.log("\nKündigung, die die Route schon in Stripe eingetragen hat");
const autoId = `trg-auto-${run}`;
const endsAt = Date.now() + 20 * DAY_MS;
await requestRef(autoId).set({
  kind: "cancel",
  locale: "en",
  data: { kind: "cancel", contract: "basic", name: "Ada", email: mail("ada"), cancelType: "ordinary", when: "date", date: "2026-12-01" },
  receivedAt: Date.now(),
  ipHash: "0".repeat(32),
  userAgent: "test",
  account: { uid: "ada", subscriptionId: "sub_test" },
  automation: { status: "done", subscriptionId: "sub_test", endsAt },
});
requestIds.push(autoId);
await handleContractRequest(autoId);
const adaMail = (await outbox()).find((m) => m.to === mail("ada"));
check("Bestätigung nennt das Enddatum", adaMail?.text.includes(`It ends on ${formatDate(endsAt, "en")}.`), true);
check("und das gewünschte Datum", adaMail?.text.includes("Requested date: 1 December 2026"), true);
check("Caspar: nichts zu tun", (await notices()).find((m) => m.replyTo === mail("ada"))?.subject, "Pairspace Kündigung: Ada, erledigt");

/* ------------------------------------------------- contract confirmation (§ 312f) */

console.log("\nVertragsbestätigung nach dem ersten Abo");
const contract = (id, extra = {}) => ({
  uid: owner.uid,
  email: mail("landlord"),
  name: "Test",
  locale: "de",
  subscriptionId: id,
  customerId: "cus_test",
  interval: "month",
  price: 9.99,
  trialEndsAt: Date.now() + 7 * DAY_MS,
  createdAt: Date.now(),
  termsVersion: "4. November 2026",
  ...extra,
});
const subDe = `sub_trg_${run}`;
await contractRef(subDe).set(contract(subDe));
check("Function schickt die Bestätigung", await handleContractCreated(subDe), { confirmation: true });
const conf = (await outbox()).find((m) => m.template === "contract-confirmation" && m.idempotencyKey === `contract-confirmation/${subDe}`);
check("an den Vermieter", [conf?.to, conf?.subject], [mail("landlord"), "Deine Vertragsbestätigung für Pairspace Basic"]);
check(
  "mit den Vertragsdaten",
  ["Pairspace Basic, Abo für Vermieter, monatlich", `${euro(9.99, "de")} im Monat, Endpreis`, `kostenlos bis ${formatDate(Date.now() + 7 * DAY_MS, "de")}`, `Vertragsnummer: ${subDe}`, "Caspar Baumeister, Dernburgstraße 7, 14057 Berlin"].filter((l) => !conf?.text.includes(l)),
  [],
);
// Every sentence of both documents, straight from the shared source the website renders.
const sentences = (doc) =>
  doc.sections.flatMap((s) => [s.title, ...s.blocks.flatMap(function parts(b) {
    if (b.kind === "box") return b.blocks.flatMap(parts);
    if (b.kind === "h3") return [b.text];
    if (b.kind === "lines") return b.items;
    const groups = b.kind === "ul" ? b.items : [b.text];
    return groups.flat().filter((x) => typeof x === "string" && x.trim().length > 12).map((x) => x.trim());
  })]);
const missingIn = (m, doc) => sentences(doc).filter((x) => !m?.text.includes(x));
const missing = (doc) => missingIn(conf, doc);
check("enthält die vollständigen AGB", missing(agbDoc("de")), []);
check("enthält die vollständige Widerrufsbelehrung mit Formular", missing(widerrufDoc("de")), []);
check("mit der Online-Widerrufsfunktion", conf?.text.includes("Sie können Ihr Widerrufsrecht auch online unter joinpairspace.com/widerrufen"), true);
check("und dem Stand der Texte", conf?.text.includes("Stand: 4. November 2026"), true);
check("HTML bleibt unter Gmails Grenze von 102 KB", Buffer.byteLength(conf?.html ?? "") < 100_000, true);
check("Gleiches Event nochmal", await handleContractCreated(subDe), { confirmation: false });
check("Genau eine Bestätigung", (await outbox()).filter((m) => m.idempotencyKey === `contract-confirmation/${subDe}`).length, 1);

const subEn = `sub_trg_en_${run}`;
await contractRef(subEn).set(contract(subEn, { locale: "en", interval: "year", price: 100, trialEndsAt: null, email: mail("en") }));
await handleContractCreated(subEn);
const confEn = (await outbox()).find((m) => m.to === mail("en"));
check("Englisch: Betreff und Preis", [confEn?.subject, confEn?.text.includes(`${euro(100, "en")} per year, final price`)], ["Your contract confirmation for Pairspace Basic", true]);
check("Englisch: verbindliche deutsche AGB und Widerrufsbelehrung vollständig", [...missingIn(confEn, agbDoc("de")), ...missingIn(confEn, widerrufDoc("de"))], []);
check("Englisch: dazu die vollständige Übersetzung", [...missingIn(confEn, agbDoc("en")), ...missingIn(confEn, widerrufDoc("en"))], []);
check("Englisch: sagt, welche Fassung gilt", confEn?.text.includes("The German version comes first and is legally binding."), true);
check("Englisch: HTML unter 102 KB", Buffer.byteLength(confEn?.html ?? "") < 100_000, true);

const subNo = `sub_trg_no_${run}`;
await contractRef(subNo).set(contract(subNo, { email: null }));
check("Ohne Mail keine Bestätigung", await handleContractCreated(subNo), { confirmation: false });

console.log("\nBeispiel aus dem devOutbox:\n");
const sample = (await outbox()).find((m) => m.to === mail("a"));
console.log(`An: ${sample.to}\nBetreff: ${sample.subject}\n\n${sample.text}\n`);
console.log(`Betreff Vermieter: ${landlordMail.subject}\n\n${landlordMail.text}\n`);

/* ------------------------------------------------------------------ cleanup */

await Promise.all((await outbox()).map((m) => db().doc(`devOutbox/${m.id}`).delete()));
await Promise.all((await notices()).map((m) => db().doc(`devOutbox/${m.id}`).delete()));
await Promise.all(requestIds.map((id) => requestRef(id).delete()));
await Promise.all([subDe, subEn, subNo].map((id) => contractRef(id).delete()));
await bucket().file(`landlords/${owner.uid}/avatar-test.webp`).delete();
await db().doc(`landlords/${owner.uid}`).delete();
await auth().deleteUser(owner.uid);
await db().recursiveDelete(db().doc(`flats/${FLAT}`));

console.log(ok ? "Alle Trigger-Checks bestanden." : "Trigger-Checks fehlgeschlagen.");
process.exit(ok ? 0 : 1);
