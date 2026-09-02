import { initialsOf, poolAvatar, tintFor } from "@/lib/avatar";

/**
 * One avatar, used everywhere a person appears: the hero orbit, the match list,
 * the organizer dashboard. Photos win over illustrations, illustrations win over
 * initials, and the whole thing stays a plain circle with a hairline border.
 */
export function PersonAvatar({
  name,
  seed,
  photoUrl,
  size = 44,
  src,
  ring = true,
}: {
  name: string;
  /** Stable id, usually the participant id. Falls back to the name. */
  seed?: string;
  photoUrl?: string | null;
  size?: number;
  /** Explicit illustration path, used by the landing page cast. */
  src?: string;
  ring?: boolean;
}) {
  const key = seed ?? name;
  const illustration = src ?? poolAvatar(key);
  const tint = tintFor(key);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        ring ? "border border-line" : ""
      }`}
      style={{ width: size, height: size, background: photoUrl ? "var(--color-sunken)" : tint }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-ink-faint"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: size * 0.3,
            }}
          >
            {initialsOf(name)}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={illustration}
            alt={name}
            width={size}
            height={size}
            className="relative h-full w-full object-cover"
            style={{ transform: "scale(1.08) translateY(4%)" }}
            loading="lazy"
          />
        </>
      )}
    </span>
  );
}
