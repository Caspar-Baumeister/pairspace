"use client";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { T } from "@/lib/i18n";
import { firebase, firebaseConfigured } from "./client";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** True while the user is only an anonymous applicant session. */
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<User>;
  ensureAnonymous: () => Promise<User>;
  /** Turns an anonymous applicant session into a permanent account. */
  linkGoogle: () => Promise<User>;
  linkEmail: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  // Linking mutates the same User object, so bump a counter to re-render.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const { auth } = firebase();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = firebase();
    return (await signInWithPopup(auth, googleProvider())).user;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { auth } = firebase();
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const { auth } = firebase();
    const { user: created } = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(created, { displayName: name });
    return created;
  }, []);

  const ensureAnonymous = useCallback(async () => {
    const { auth } = firebase();
    if (auth.currentUser) return auth.currentUser;
    return (await signInAnonymously(auth)).user;
  }, []);

  const linkGoogle = useCallback(async () => {
    const { auth } = firebase();
    if (!auth.currentUser) throw new Error("Not signed in");
    const res = await linkWithPopup(auth.currentUser, googleProvider());
    setUser(res.user);
    setVersion((v) => v + 1);
    return res.user;
  }, []);

  const linkEmail = useCallback(async (email: string, password: string) => {
    const { auth } = firebase();
    if (!auth.currentUser) throw new Error("Not signed in");
    const res = await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password));
    setUser(res.user);
    setVersion((v) => v + 1);
    return res.user;
  }, []);

  const signOut = useCallback(async () => {
    const { auth } = firebase();
    await fbSignOut(auth);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured: firebaseConfigured,
      isAnonymous: Boolean(user?.isAnonymous),
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      ensureAnonymous,
      linkGoogle,
      linkEmail,
      signOut,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, version, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, ensureAnonymous, linkGoogle, linkEmail, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Readable message for the common Firebase auth errors, empty when the person just closed the popup. */
export function authErrorMessage(e: unknown, t: T): string {
  const code = (e as { code?: string }).code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return t("Mail oder Passwort stimmen nicht.", "Email or password is wrong.");
    case "auth/email-already-in-use":
    case "auth/credential-already-in-use":
      return t("Zu dieser Mail gibt es schon ein Konto.", "There is already an account for this email.");
    case "auth/weak-password":
      return t("Das Passwort braucht mindestens 6 Zeichen.", "The password needs at least 6 characters.");
    case "auth/invalid-email":
      return t("Diese Mail sieht nicht richtig aus.", "This email does not look right.");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    default:
      return t("Das hat nicht geklappt. Bitte versuch es nochmal.", "That did not work. Please try again.");
  }
}
