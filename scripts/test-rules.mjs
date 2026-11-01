/**
 * Probes firestore.rules in the local emulator with forged tokens.
 * Needs the emulators running and the demo data seeded:
 *
 *   npm run emulators
 *   npm run seed
 *   npm run test:rules
 */
const P = "pairspace-live";
const BASE = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (uid, provider = "anonymous") =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({ iss: `https://securetoken.google.com/${P}`, aud: P, sub: uid, user_id: uid, iat: 1, exp: 9999999999, firebase: { sign_in_provider: provider } })}.`;
const get = (path, uid, provider) => fetch(`${BASE}/${path}`, { headers: uid ? { Authorization: `Bearer ${token(uid, provider)}` } : {} }).then((r) => r.status);
const patch = (path, fields, mask, uid, provider) =>
  fetch(`${BASE}/${path}?${mask.map((m) => `updateMask.fieldPaths=${m}`).join("&")}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token(uid, provider)}` },
    body: JSON.stringify({ fields }),
  }).then((r) => r.status);

const landlordUid = (await (await fetch(`${BASE}/flats/demo2wg8`, { headers: { Authorization: "Bearer owner" } })).json()).fields.ownerUid.stringValue;
const checks = [
  ["Fremder liest live Wohnung (ohne Login)", await get("flats/demo2wg8"), 200],
  ["Anonymer Bewerber liest Profile der Wohnung", await get("flats/demo2wg8/applicants/demo-lena", "anon1"), 200],
  ["Ohne Login liest Profile", await get("flats/demo2wg8/applicants/demo-lena"), 403],
  ["Bewerber liest fremden Stimmzettel", await get("flats/demo2wg8/ballots/demo-lena", "anon1"), 403],
  ["Bewerber liest fremde Kontaktdaten", await get("flats/demo2wg8/applicants/demo-lena/private/contact", "anon1"), 403],
  ["Bewerber liest eigenen Stimmzettel", await get("flats/demo2wg8/ballots/demo-lena", "demo-lena"), 200],
  ["Vermieter liest Stimmzettel", await get("flats/demo2wg8/ballots/demo-lena", landlordUid, "password"), 200],
  ["Vermieter liest Kontaktdaten", await get("flats/demo2wg8/applicants/demo-lena/private/contact", landlordUid, "password"), 200],
  ["Fremder Vermieter liest Stimmzettel", await get("flats/demo2wg8/ballots/demo-lena", "otherLandlord", "password"), 403],
  ["Vermieter schreibt sich selbst ein Abo", await patch(`landlords/${landlordUid}`, { subscription: { mapValue: { fields: { status: { stringValue: "active" } } } } }, ["subscription"], landlordUid, "password"), 403],
  ["Bewerber schreibt Stimmzettel eines anderen", await patch("flats/demo2wg8/ballots/demo-lena", { uid: { stringValue: "demo-lena" }, votes: { mapValue: {} }, roomRanks: { mapValue: {} } }, ["uid", "votes", "roomRanks"], "anon1"), 403],
  ["Bewerber ändert die Wohnung", await patch("flats/demo2wg8", { title: { stringValue: "gehackt" } }, ["title"], "anon1"), 403],
];
let ok = true;
for (const [name, got, want] of checks) {
  const pass = got === want;
  ok &&= pass;
  console.log(`${pass ? "ok  " : "FAIL"} ${name}: ${got} (erwartet ${want})`);
}
process.exit(ok ? 0 : 1);
