"use client";

import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import type { Locale } from "../i18n";
import type { Applicant, ApplicantContact, Ballot, Flat, Landlord, Lifestyle, Room, Vote } from "../types";
import { firebase } from "./client";
import { randomId } from "./storage";

/* ------------------------------------------------------------------ hooks */

export interface Live<T> {
  data: T;
  loading: boolean;
  /** Firestore error code, for example "permission-denied". */
  error: string | null;
}

/** Realtime single document. Pass null to wait. */
export function useDoc<T>(path: string | null): Live<T | null> {
  const [state, setState] = useState<Live<T | null>>({ data: null, loading: Boolean(path), error: null });
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const { db } = firebase();
    return onSnapshot(
      doc(db, path),
      (snap) =>
        setState({
          data: snap.exists() ? ({ ...(snap.data() as DocumentData), id: snap.id } as T) : null,
          loading: false,
          error: null,
        }),
      (e) => setState({ data: null, loading: false, error: (e as { code?: string }).code ?? "unknown" }),
    );
  }, [path]);
  return state;
}

/** Realtime collection, optionally filtered by one equality. Pass null to wait. */
export function useCollection<T>(path: string | null, filter?: [string, string]): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: Boolean(path), error: null });
  const key = filter ? filter.join("=") : "";
  useEffect(() => {
    if (!path) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const { db } = firebase();
    const ref = collection(db, path);
    const q = filter ? query(ref, where(filter[0], "==", filter[1])) : ref;
    return onSnapshot(
      q,
      (snap) =>
        setState({
          data: snap.docs.map((d) => ({ ...(d.data() as DocumentData), id: d.id }) as T),
          loading: false,
          error: null,
        }),
      (e) => setState({ data: [], loading: false, error: (e as { code?: string }).code ?? "unknown" }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);
  return state;
}

export const useLandlord = (uid: string | null | undefined) => useDoc<Landlord>(uid ? `landlords/${uid}` : null);

export function useMyFlats(uid: string | null | undefined) {
  const live = useCollection<Flat>(uid ? "flats" : null, uid ? ["ownerUid", uid] : undefined);
  return { ...live, data: [...live.data].sort((a, b) => a.createdAt - b.createdAt) };
}

export const useFlat = (flatId: string | null | undefined) => useDoc<Flat>(flatId ? `flats/${flatId}` : null);

export function useApplicants(flatId: string | null | undefined) {
  return useCollection<Applicant & { id: string }>(flatId ? `flats/${flatId}/applicants` : null);
}

/** Landlord only, every ballot of the flat. */
export function useBallots(flatId: string | null | undefined) {
  return useCollection<Ballot & { id: string }>(flatId ? `flats/${flatId}/ballots` : null);
}

export function useBallot(flatId: string | null | undefined, uid: string | null | undefined) {
  return useDoc<Ballot>(flatId && uid ? `flats/${flatId}/ballots/${uid}` : null);
}

export function useApplicant(flatId: string | null | undefined, uid: string | null | undefined) {
  return useDoc<Applicant>(flatId && uid ? `flats/${flatId}/applicants/${uid}` : null);
}

export function useContact(flatId: string | null | undefined, uid: string | null | undefined) {
  return useDoc<ApplicantContact>(flatId && uid ? `flats/${flatId}/applicants/${uid}/private/contact` : null);
}

/* -------------------------------------------------------------- landlord */

export async function ensureLandlord(user: User, name?: string): Promise<void> {
  const { db } = firebase();
  const ref = doc(db, "landlords", user.uid);
  const snap = await getDoc(ref);
  const now = Date.now();
  if (snap.exists()) {
    await updateDoc(ref, { email: user.email, updatedAt: now });
    return;
  }
  const landlord: Omit<Landlord, "subscription"> = {
    uid: user.uid,
    name: name || user.displayName || "",
    email: user.email,
    about: "",
    photo: null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, landlord);
}

export async function updateLandlord(uid: string, patch: Partial<Pick<Landlord, "name" | "about" | "photo">>) {
  const { db } = firebase();
  await updateDoc(doc(db, "landlords", uid), { ...patch, updatedAt: Date.now() });
}

/* ------------------------------------------------------------------ flat */

export function newRoom(index: number, locale: Locale = "de"): Room {
  return {
    id: randomId(6),
    name: locale === "en" ? `Room ${index + 1}` : `Zimmer ${index + 1}`,
    rent: null,
    size: null,
    photo: null,
    availableFrom: null,
    note: "",
  };
}

export async function createFlat(
  owner: Pick<Landlord, "uid" | "name" | "about" | "photo">,
  data: Pick<Flat, "title" | "city" | "district" | "description">,
  locale: Locale = "de",
): Promise<string> {
  const { db } = firebase();
  const id = randomId(8);
  const now = Date.now();
  const flat: Flat = {
    id,
    ownerUid: owner.uid,
    ...data,
    host: { name: owner.name, about: owner.about, photoUrl: owner.photo?.url ?? null },
    rooms: [newRoom(0, locale), newRoom(1, locale), newRoom(2, locale)],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "flats", id), flat);
  return id;
}

export async function updateFlat(flatId: string, patch: Partial<Omit<Flat, "id" | "ownerUid" | "createdAt">>) {
  const { db } = firebase();
  await updateDoc(doc(db, "flats", flatId), { ...patch, updatedAt: Date.now() });
}

/** Deletes the flat itself. Delete the applications first, see deleteApplications. */
export async function deleteFlat(flatId: string) {
  const { db } = firebase();
  await deleteDoc(doc(db, "flats", flatId));
}

/** Ends the search: deletes every application, ballot and contact of the flat. */
export async function deleteApplications(flatId: string): Promise<number> {
  const { db } = firebase();
  const [applicants, ballots] = await Promise.all([
    getDocs(collection(db, "flats", flatId, "applicants")),
    getDocs(collection(db, "flats", flatId, "ballots")),
  ]);
  const batch = writeBatch(db);
  applicants.docs.forEach((d) => {
    batch.delete(doc(db, "flats", flatId, "applicants", d.id, "private", "contact"));
    batch.delete(d.ref);
  });
  ballots.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return applicants.size;
}

/* ------------------------------------------------------------- applicant */

export const emptyLifestyle: Lifestyle = {
  cleanliness: null,
  flatLife: null,
  rhythm: null,
  smoker: null,
  pets: null,
};

export function emptyApplicant(uid: string): Applicant {
  const now = Date.now();
  return {
    uid,
    firstName: "",
    age: null,
    occupation: "",
    bio: "",
    photos: [],
    interests: [],
    languages: [],
    lifestyle: emptyLifestyle,
    moveIn: null,
    stay: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveApplicant(flatId: string, applicant: Applicant): Promise<void> {
  const { db } = firebase();
  const { id: _ignored, ...data } = applicant as Applicant & { id?: string };
  await setDoc(doc(db, "flats", flatId, "applicants", applicant.uid), { ...data, updatedAt: Date.now() });
}

export async function saveContact(flatId: string, uid: string, contact: Omit<ApplicantContact, "updatedAt">) {
  const { db } = firebase();
  await setDoc(doc(db, "flats", flatId, "applicants", uid, "private", "contact"), {
    ...contact,
    updatedAt: Date.now(),
  });
}

export async function saveVote(flatId: string, uid: string, other: string, vote: Vote | null) {
  const { db } = firebase();
  const ref = doc(db, "flats", flatId, "ballots", uid);
  const snap = await getDoc(ref);
  const votes = { ...((snap.data()?.votes as Record<string, Vote>) ?? {}) };
  if (vote === null) delete votes[other];
  else votes[other] = vote;
  await setDoc(ref, { uid, votes, roomRanks: snap.data()?.roomRanks ?? {}, updatedAt: Date.now() });
}

export async function saveRoomRanks(flatId: string, uid: string, roomRanks: Record<string, number>) {
  const { db } = firebase();
  const ref = doc(db, "flats", flatId, "ballots", uid);
  const snap = await getDoc(ref);
  await setDoc(ref, { uid, votes: snap.data()?.votes ?? {}, roomRanks, updatedAt: Date.now() });
}

export async function withdrawApplication(flatId: string, uid: string) {
  const { db } = firebase();
  await Promise.all([
    deleteDoc(doc(db, "flats", flatId, "applicants", uid, "private", "contact")),
    deleteDoc(doc(db, "flats", flatId, "ballots", uid)),
  ]);
  await deleteDoc(doc(db, "flats", flatId, "applicants", uid));
}
