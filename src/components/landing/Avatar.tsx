const TINTS: Record<string, { bg: string; fg: string }> = {
  base: { bg: "#EDF1FE", fg: "#2B4EF0" },
  flyer: { bg: "#F1EDFE", fg: "#5B3FE0" },
  leader: { bg: "#E9F6EE", fg: "#15803D" },
  follower: { bg: "#FDF4E7", fg: "#B45309" },
  both: { bg: "#F4F4F5", fg: "#3C3C42" },
  switch: { bg: "#EAF6F8", fg: "#0E7490" },
};

export interface PersonMark {
  name: string;
  role: keyof typeof TINTS | string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const tint = TINTS[person.role.toLowerCase()] ?? TINTS.both;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex items-center justify-center rounded-full border border-line bg-surface"
        style={{ width: size, height: size, boxShadow: "var(--shadow-sm)" }}
        aria-hidden="true"
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: size - 8,
            height: size - 8,
            background: tint.bg,
            color: tint.fg,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: size * 0.32,
            letterSpacing: "-0.02em",
          }}
        >
          {initials(person.name)}
        </div>
      </div>
      {showRole ? (
        <span
          className="rounded-full border border-line bg-surface px-2 py-[3px] text-[0.6875rem] font-medium leading-none"
          style={{ color: tint.fg, boxShadow: "var(--shadow-xs)" }}
        >
          {person.role}
        </span>
      ) : null}
      <span className="sr-only">{`${person.name}, ${person.role}`}</span>
    </div>
  );
}
