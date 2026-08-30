import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

/**
 * Returns the admin Firestore instance, or null when no service account is
 * configured. Public pages fall back to client side reads in that case, so the
 * app still runs before Firebase is wired up.
 */
export function adminDb(): Firestore | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    if (!app) {
      app = getApps().length
        ? getApps()[0]
        : initializeApp({ credential: cert(JSON.parse(raw)) });
    }
    return getFirestore(app);
  } catch (error) {
    console.error("Firebase admin init failed", error);
    return null;
  }
}
