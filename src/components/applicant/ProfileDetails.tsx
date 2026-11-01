"use client";

import {
  Briefcase,
  CalendarDays,
  Cigarette,
  Clock,
  Languages,
  Moon,
  PawPrint,
  Sparkles,
  Sun,
  Sunrise,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { CLEANLINESS, FLAT_LIFE, RHYTHM, STAY, formatDate, labelOf } from "@/lib/options";
import type { Applicant } from "@/lib/types";

export interface Fact {
  icon: LucideIcon;
  label: string;
}

/** Lifestyle, languages and timing as short lines with an icon. */
export function profileFacts(a: Applicant): Fact[] {
  const out: Fact[] = [];
  const l = a.lifestyle;
  if (l?.cleanliness) out.push({ icon: Sparkles, label: `Sauberkeit: ${labelOf(CLEANLINESS, l.cleanliness)}` });
  if (l?.flatLife) out.push({ icon: Users, label: `WG Leben: ${labelOf(FLAT_LIFE, l.flatLife)}` });
  if (l?.rhythm) {
    const icon = l.rhythm === "night" ? Moon : l.rhythm === "early" ? Sunrise : Sun;
    out.push({ icon, label: labelOf(RHYTHM, l.rhythm) ?? "" });
  }
  if (l && l.smoker !== null && l.smoker !== undefined)
    out.push({ icon: Cigarette, label: l.smoker ? "Raucht" : "Raucht nicht" });
  if (l && l.pets !== null && l.pets !== undefined)
    out.push({ icon: PawPrint, label: l.pets ? "Bringt ein Haustier mit" : "Kein Haustier" });
  if (a.languages?.length) out.push({ icon: Languages, label: a.languages.join(", ") });
  const from = formatDate(a.moveIn);
  if (from) out.push({ icon: CalendarDays, label: `Einzug ab ${from}` });
  if (a.stay) out.push({ icon: Clock, label: labelOf(STAY, a.stay) ?? "" });
  return out;
}

export function ProfileFacts({ applicant }: { applicant: Applicant }) {
  const facts = profileFacts(applicant);
  if (!facts.length) return null;
  return (
    <ul className="grid gap-1.5">
      {facts.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-ui-small text-muted">
          <Icon size={14} strokeWidth={1.75} className="shrink-0 text-faint" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function displayName(a: Pick<Applicant, "firstName" | "age">): string {
  const name = a.firstName || "Ohne Namen";
  return a.age ? `${name}, ${a.age}` : name;
}

/**
 * Read only profile, free of flow state. Fits a 340px sidebar; `compact`
 * shrinks the photo for tighter spots.
 */
export function ProfileDetails({ applicant, compact = false }: { applicant: Applicant; compact?: boolean }) {
  const photos = applicant.photos ?? [];
  const [active, setActive] = useState(0);
  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div className="grid gap-4">
      <div>
        <div
          className={`relative overflow-hidden rounded-xl bg-base-25 ${compact ? "aspect-square" : "aspect-[4/5]"}`}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={applicant.firstName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-faint">
              <UserRound size={40} strokeWidth={1.25} />
            </div>
          )}
        </div>
        {photos.length > 1 ? (
          <div className="mt-2 flex gap-1.5 overflow-x-auto">
            {photos.map((p, i) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Foto ${i + 1}`}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border ${
                  i === active ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="h4 text-ink">{displayName(applicant)}</h3>
        {applicant.occupation ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-ui-small text-muted">
            <Briefcase size={13} strokeWidth={1.75} className="text-faint" />
            {applicant.occupation}
          </p>
        ) : null}
      </div>

      {applicant.bio ? (
        <p className="whitespace-pre-line text-ui-small leading-relaxed text-ink">{applicant.bio}</p>
      ) : null}

      {applicant.interests?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {applicant.interests.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      ) : null}

      <ProfileFacts applicant={applicant} />
    </div>
  );
}
