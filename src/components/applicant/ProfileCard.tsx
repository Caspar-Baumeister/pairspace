"use client";

import { Briefcase, UserRound } from "lucide-react";
import { useState } from "react";

import type { Applicant } from "@/lib/types";
import { displayName } from "./ProfileDetails";

/**
 * The swipe card: a 4:5 photo with Tinder style segment bars, tap the left or
 * right half to flip through the photos. Name and job sit on a gradient.
 * Give it a `key` per applicant so the photo index resets.
 */
export function ProfileCard({ applicant, className = "" }: { applicant: Applicant; className?: string }) {
  const photos = applicant.photos ?? [];
  const [index, setIndex] = useState(0);
  const current = photos[Math.min(index, Math.max(photos.length - 1, 0))];

  return (
    <div
      className={`relative aspect-[4/5] w-full select-none overflow-hidden rounded-2xl border border-line bg-base-25 shadow-[0_14px_40px_rgba(0,0,0,0.45)] ${className}`}
    >
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.url}
          alt={applicant.firstName}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-faint">
          <UserRound size={64} strokeWidth={1} />
        </div>
      )}

      {photos.length > 1 ? (
        <>
          <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2">
            {photos.map((p, i) => (
              <span
                key={p.path}
                className={`h-[3px] flex-1 rounded-full ${i === index ? "bg-white" : "bg-white/35"}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Vorheriges Foto"
            className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-w-resize focus-visible:outline-none"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          />
          <button
            type="button"
            aria-label="Nächstes Foto"
            className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-e-resize focus-visible:outline-none"
            onClick={() => setIndex((i) => Math.min(photos.length - 1, i + 1))}
          />
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-20">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.015em] text-white">
          {displayName(applicant)}
        </h2>
        {applicant.occupation ? (
          <p className="mt-1 flex items-center gap-1.5 text-ui-medium text-white/85">
            <Briefcase size={15} strokeWidth={1.75} />
            {applicant.occupation}
          </p>
        ) : null}
      </div>
    </div>
  );
}
