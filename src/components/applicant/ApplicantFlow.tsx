"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/firebase/auth";
import { firebase } from "@/lib/firebase/client";
import { useApplicant, useApplicants, useBallot, useContact, useFlat } from "@/lib/firebase/data";
import type { Applicant, Vote } from "@/lib/types";
import { ContactStep } from "./ContactStep";
import { DoneView, HomeView, type HomeTarget } from "./HomeView";
import { Intro, NotLive } from "./Intro";
import { ProfileStep } from "./ProfileStep";
import { RateStep } from "./RateStep";
import { RoomStep } from "./RoomStep";

type Step = "intro" | "rate" | "rooms" | "profile" | "contact" | "done" | "home";

/**
 * The page behind the public link. New applicants go
 * intro → rate → rooms → profile → contact → done, returning applicants land
 * on home and jump into single steps from there.
 */
export function ApplicantFlow({ flatId }: { flatId: string }) {
  const auth = useAuth();
  const uid = auth.user?.uid ?? null;
  const flat = useFlat(flatId);
  const live = flat.data?.status === "live";
  const liveId = live ? flatId : null;

  const me = useApplicant(liveId, uid);
  const ballot = useBallot(liveId, uid);
  const contact = useContact(liveId, uid);
  const applicants = useApplicants(live && uid ? flatId : null);

  const [step, setStep] = useState<Step | null>(null);
  // True once the application is complete and the person works from the home view.
  const [returning, setReturning] = useState(false);

  // Decide the first screen once, from a direct read, so a half loaded
  // realtime listener can never send a returning applicant to the intro.
  useEffect(() => {
    if (step !== null || auth.loading || flat.loading || !live) return;
    if (!uid) {
      setStep("intro");
      return;
    }
    let cancelled = false;
    const { db } = firebase();
    Promise.all([
      getDoc(doc(db, "flats", flatId, "applicants", uid)),
      getDoc(doc(db, "flats", flatId, "ballots", uid)),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        if (a.exists() && a.data().status === "complete") {
          setReturning(true);
          setStep("home");
        } else if (b.exists()) setStep("rate");
        else setStep("intro");
      })
      .catch(() => !cancelled && setStep("intro"));
    return () => {
      cancelled = true;
    };
  }, [step, auth.loading, flat.loading, live, uid, flatId]);

  // Every step starts at the top, the intro is long enough to leave you mid page.
  useEffect(() => {
    if (step) window.scrollTo({ top: 0 });
  }, [step]);

  const others = useMemo<Applicant[]>(
    () => applicants.data.filter((a) => a.status === "complete" && a.uid !== uid),
    [applicants.data, uid],
  );
  const votes: Record<string, Vote> = ballot.data?.votes ?? {};
  const ranks = ballot.data?.roomRanks;

  if (auth.loading || flat.loading) return <FullScreenSpinner />;

  const isOwner = Boolean(uid && flat.data && flat.data.ownerUid === uid);
  if (!flat.data || !live) return <NotLive isOwner={isOwner} />;
  const f = flat.data;

  if (step === null || (step !== "intro" && !uid)) return <FullScreenSpinner />;

  const complete = me.data?.status === "complete";
  const multipleRooms = f.rooms.length > 1;
  const toHome = () => {
    setReturning(true);
    setStep("home");
  };
  const startFlow = () => {
    setReturning(false);
    setStep("rate");
  };
  const ratedCount = others.filter((o) => votes[o.uid] !== undefined).length;

  switch (step) {
    case "intro":
      return (
        <Intro
          flat={f}
          isOwner={isOwner}
          onStart={async () => {
            await auth.ensureAnonymous();
            if (complete) toHome();
            else startFlow();
          }}
        />
      );

    case "rate":
      return (
        <RateStep
          key="rate"
          flatId={flatId}
          uid={uid!}
          flatTitle={f.title}
          others={others}
          votes={votes}
          returning={returning}
          onBack={returning ? toHome : () => setStep("intro")}
          onDone={returning ? toHome : () => setStep(multipleRooms ? "rooms" : "profile")}
        />
      );

    case "rooms":
      return (
        <RoomStep
          key={`rooms-${ballot.loading ? "loading" : "ready"}`}
          flatId={flatId}
          uid={uid!}
          flatTitle={f.title}
          rooms={f.rooms}
          ranks={ranks}
          returning={returning}
          onBack={returning ? toHome : () => setStep("rate")}
          onDone={returning ? toHome : () => setStep("profile")}
        />
      );

    case "profile":
      if (me.loading) return <FullScreenSpinner />;
      return (
        <ProfileStep
          key="profile"
          flatId={flatId}
          uid={uid!}
          flatTitle={f.title}
          me={me.data}
          returning={returning}
          onBack={returning ? toHome : () => setStep(multipleRooms ? "rooms" : "rate")}
          onDone={returning ? toHome : () => setStep("contact")}
        />
      );

    case "contact":
      if (contact.loading) return <FullScreenSpinner />;
      return (
        <ContactStep
          key="contact"
          flatId={flatId}
          uid={uid!}
          flatTitle={f.title}
          contact={contact.data}
          returning={returning}
          onBack={returning ? toHome : () => setStep("profile")}
          onDone={returning ? toHome : () => setStep("done")}
        />
      );

    case "done":
      return <DoneView flat={f} ratedCount={ratedCount} ranks={ranks} onContinue={toHome} />;

    case "home":
      if (me.loading) return <FullScreenSpinner />;
      if (!me.data) {
        // Withdrawn, or the landlord ended the search.
        return <Intro flat={f} isOwner={isOwner} onStart={async () => startFlow()} />;
      }
      return (
        <HomeView
          flat={f}
          uid={uid!}
          me={me.data}
          others={others}
          votes={votes}
          ranks={ranks}
          contact={contact.data}
          onGo={(target: HomeTarget) => setStep(target)}
          onWithdrawn={() => {
            setReturning(false);
            setStep("intro");
          }}
        />
      );
  }
}
