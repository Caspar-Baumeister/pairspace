import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { castAvatar } from "@/lib/avatar";

const TINTS: Record<string, string> = {
  base: "#0D8A5E",
  flyer: "#5B3FE0",
  leader: "#15803D",
  follower: "#B45309",
  both: "#3C3C42",
  switch: "#0E7490",
};

export interface PersonMark {
  name: string;
  role: string;
  /** Seed of a pre rendered cast portrait in public/avatars. */
  seed: string;
}

export function Avatar({
  person,
  size = 60,
  showRole = true,
}: {
  person: PersonMark;
  size?: number;
  showRole?: boolean;
}) {
  const color = TINTS[person.role.toLowerCase()] ?? TINTS.both;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="rounded-full bg-surface"
        style={{ boxShadow: "var(--shadow-sm)", display: "inline-flex" }}
      >
        <PersonAvatar name={person.name} src={castAvatar(person.seed)} size={size} />
      </span>
      {showRole ? (
        <span
          className="rounded-full border border-line bg-surface px-2 py-[3px] text-[0.6875rem] font-medium leading-none"
          style={{ color, boxShadow: "var(--shadow-xs)" }}
        >
          {person.role}
        </span>
      ) : null}
      <span className="sr-only">{`${person.name}, ${person.role}`}</span>
    </div>
  );
}
