import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

/**
 * Admin SDK for route handlers. Uses FIREBASE_SERVICE_ACCOUNT_JSON when set,
 * otherwise the default credentials of the runtime: App Hosting provides them
 * in production, and locally the emulator hosts in .env.local take over.
 */
function adminApp(): App {
  if (app) return app;
  if (getApps().length) return (app = getApps()[0]);
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  app = raw
    ? initializeApp({ credential: cert(JSON.parse(raw)) })
    : initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export interface Caller {
  uid: string;
  email?: string;
  name?: string;
}

/** The landlord behind `Authorization: Bearer <id token>`, or null. Anonymous applicants never count. */
export async function landlordFromRequest(request: Request): Promise<Caller | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if (decoded.firebase.sign_in_provider === "anonymous") return null;
    return { uid: decoded.uid, email: decoded.email, name: decoded.name as string | undefined };
  } catch {
    return null;
  }
}
