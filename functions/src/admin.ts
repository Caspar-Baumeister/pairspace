import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/** Named on purpose: newer projects use .firebasestorage.app, which the default config does not always carry. */
const BUCKET = process.env.STORAGE_BUCKET ?? "pairspace-live.firebasestorage.app";

function app(): App {
  return getApps()[0] ?? initializeApp();
}

export const db = () => getFirestore(app());
export const auth = () => getAuth(app());
export const bucket = () => getStorage(app()).bucket(BUCKET);

/**
 * True in the functions emulator and in local scripts that talk to the
 * emulators. Mail then lands in the devOutbox collection instead of Resend.
 */
export function isEmulator(): boolean {
  return process.env.FUNCTIONS_EMULATOR === "true" || Boolean(process.env.FIRESTORE_EMULATOR_HOST);
}
