/**
 * One time migration: moves the email address out of every public participant
 * document into participants/{id}/private/contact, and sets contactMethods.
 *
 * Runs against the live project through the Firestore REST API, authenticated
 * with the same Google account the Firebase CLI is signed in with. Safe to run
 * again: participants that already have a contact document are skipped.
 *
 *   node scripts/migrate-contacts.mjs            dry run, prints what it would do
 *   node scripts/migrate-contacts.mjs --apply    writes
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const PROJECT = process.env.PROJECT_ID ?? "pairspace-live";
const APPLY = process.argv.includes("--apply");
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// The Firebase CLI keeps a refresh token in its config store. Its OAuth client
// id and secret are public, they ship inside the CLI itself.
async function accessToken() {
  const cfg = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, "utf8"));
  const body = new URLSearchParams({
    client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
    client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
    refresh_token: cfg.tokens.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  const json = await res.json();
  if (!json.access_token) throw new Error(`No access token: ${JSON.stringify(json)}`);
  return json.access_token;
}

const token = await accessToken();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function list(path) {
  const out = [];
  let pageToken = "";
  do {
    const url = `${BASE}/${path}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const json = await (await fetch(url, { headers })).json();
    out.push(...(json.documents ?? []));
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

async function get(path) {
  const res = await fetch(`${BASE}/${path}`, { headers });
  return res.status === 200 ? res.json() : null;
}

const str = (v) => v?.stringValue ?? "";

let moved = 0;
let skipped = 0;

for (const eventDoc of await list("events")) {
  const eventId = eventDoc.name.split("/").pop();
  for (const p of await list(`events/${eventId}/participants`)) {
    const pid = p.name.split("/").pop();
    const f = p.fields ?? {};
    const email = str(f.email).trim().toLowerCase();
    const hasMethods = (f.contactMethods?.arrayValue?.values ?? []).length > 0;

    if (await get(`events/${eventId}/participants/${pid}/private/contact`)) {
      skipped += 1;
      continue;
    }

    const methods = email ? ["email"] : ["link"];
    console.log(
      `${APPLY ? "moving" : "would move"} ${eventId}/${pid} ${str(f.firstName)} ` +
        `email=${email ? email.replace(/(.{2}).*(@.*)/, "$1***$2") : "(none)"} methods=${methods.join(",")}` +
        (hasMethods ? " (methods already set)" : ""),
    );
    if (!APPLY) continue;

    // 1. Private contact document.
    const contactRes = await fetch(`${BASE}/events/${eventId}/participants/${pid}/private/contact`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fields: {
          uid: { stringValue: str(f.uid) },
          email: { stringValue: email },
          phone: { stringValue: "" },
          updatedAt: { integerValue: String(Date.now()) },
        },
      }),
    });
    if (!contactRes.ok) throw new Error(`contact write failed: ${await contactRes.text()}`);

    // 2. Public document: set contactMethods, drop email and emailVerified.
    const mask = ["contactMethods", "email", "emailVerified"]
      .map((k) => `updateMask.fieldPaths=${k}`)
      .join("&");
    const fields = {
      contactMethods: { arrayValue: { values: methods.map((m) => ({ stringValue: m })) } },
    };
    const pubRes = await fetch(`${BASE}/events/${eventId}/participants/${pid}?${mask}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields }),
    });
    if (!pubRes.ok) throw new Error(`profile update failed: ${await pubRes.text()}`);
    moved += 1;
  }
}

console.log(`\n${APPLY ? "moved" : "would move"} ${moved}, skipped ${skipped} already migrated`);
if (!APPLY) console.log("Run again with --apply to write.");
