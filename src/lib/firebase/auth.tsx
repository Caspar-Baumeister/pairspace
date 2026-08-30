"use client";

import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { firebase, firebaseConfigured } from "./client";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** True while the user is only an anonymous participant session. */
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  ensureAnonymous: () => Promise<User>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const { auth } = firebase();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const persistOrganizer = useCallback(async (u: User) => {
    const { db } = firebase();
    await setDoc(
      doc(db, "users", u.uid),
      {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = firebase();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const res = await signInWithPopup(auth, provider);
    await persistOrganizer(res.user);
    return res.user;
  }, [persistOrganizer]);

  const signInWithApple = useCallback(async () => {
    const { auth } = firebase();
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const res = await signInWithPopup(auth, provider);
    await persistOrganizer(res.user);
    return res.user;
  }, [persistOrganizer]);

  const ensureAnonymous = useCallback(async () => {
    const { auth } = firebase();
    if (auth.currentUser) return auth.currentUser;
    const res = await signInAnonymously(auth);
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
      signInWithApple,
      ensureAnonymous,
      signOut,
    }),
    [user, loading, signInWithGoogle, signInWithApple, ensureAnonymous, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
