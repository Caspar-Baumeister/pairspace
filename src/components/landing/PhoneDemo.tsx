"use client";

import { useEffect, useState } from "react";

import { ProfileCard } from "@/components/applicant/ProfileCard";
import { VoteButtons } from "@/components/applicant/VoteButtons";
import type { Applicant, Vote } from "@/lib/types";

const demo = (uid: string, firstName: string, age: number, occupation: string): Applicant => ({
  uid,
  firstName,
  age,
  occupation,
  bio: "",
  photos: [{ url: `/people/${uid}.webp`, path: uid }],
  interests: [],
  languages: [],
  lifestyle: { cleanliness: null, flatLife: null, rhythm: null, smoker: null, pets: null },
  moveIn: null,
  stay: null,
  status: "complete",
  createdAt: 0,
  updatedAt: 0,
});

const DECK: { applicant: Applicant; vote: Vote }[] = [
  { applicant: demo("lena", "Lena", 23, "Medizinstudium"), vote: 2 },
  { applicant: demo("jonas", "Jonas", 24, "Maschinenbau Master"), vote: 1 },
  { applicant: demo("sophie", "Sophie", 23, "Psychologie"), vote: 2 },
  { applicant: demo("noah", "Noah", 27, "Musiker und Barista"), vote: 0 },
];

type Phase = "show" | "voted" | "out";

/**
 * The applicant side on a phone: rate a flatmate, the card flies off, the
 * next one comes. Plays by itself, clicking a button does the same.
 * Always 360 wide like a real phone, center it in a flex row and it scales
 * down a little on small screens.
 */
export function PhoneDemo() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("show");
  const [picked, setPicked] = useState<Vote | null>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    // Without motion the deck only moves when someone clicks.
    if (still && phase === "show") return;
    const card = DECK[index % DECK.length];
    const wait = phase === "show" ? 1700 : phase === "voted" ? 450 : 320;
    const t = setTimeout(() => {
      if (phase === "show") {
        setPicked(card.vote);
        setPhase("voted");
      } else if (phase === "voted") {
        setPhase("out");
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
        setPhase("show");
      }
    }, wait);
    return () => clearTimeout(t);
  }, [index, phase, still]);

  const card = DECK[index % DECK.length];
  const next = DECK[(index + 1) % DECK.length];
  const vote = picked ?? card.vote;
  const out = phase === "out";
  const dx = vote >= 1 ? 1 : vote <= -1 ? -1 : 0;

  return (
    <div className="w-[360px] shrink-0 origin-top rounded-[46px] max-sm:scale-[0.92] border border-line-strong bg-[#0c0c0c] p-[10px] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
      <div className="relative overflow-hidden rounded-[37px] bg-bg">
        <div className="flex h-11 items-center justify-between px-7 text-[13px] font-semibold text-ink">
          <span>9:41</span>
          <span className="h-[22px] w-[86px] rounded-full bg-black" />
          <span className="text-faint">5G</span>
        </div>
        <div className="px-4 pb-5">
          <div className="flex items-baseline justify-between">
            <span className="text-ui-medium font-semibold text-ink">3er WG Weserstraße</span>
            <span className="text-ui-smaller tabular-nums text-faint">{(index % 13) + 1} von 13</span>
          </div>
          <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-base-30">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(((index % 13) + 1) / 13) * 100}%` }} />
          </div>

          <div className="relative mt-4">
            {/* The next card waits underneath */}
            <div className="absolute inset-0 scale-[0.96] opacity-60">
              <ProfileCard key={`under-${next.applicant.uid}`} applicant={next.applicant} />
            </div>
            <div
              className="relative"
              style={{
                transition: out ? "transform 320ms ease-in, opacity 320ms ease-in" : "none",
                transform: out ? `translate(${dx * 120}%, ${dx === 0 ? -40 : 6}%) rotate(${dx * 14}deg)` : "none",
                opacity: out ? 0 : 1,
              }}
            >
              <ProfileCard key={card.applicant.uid} applicant={card.applicant} />
            </div>
          </div>

          <div className="mt-4">
            <VoteButtons
              selected={phase === "show" ? null : vote}
              onVote={(v) => {
                if (phase !== "show") return;
                setPicked(v);
                setPhase("voted");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
