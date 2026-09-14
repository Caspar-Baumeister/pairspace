import Link from "next/link";

/**
 * Two rounded shapes leaning into each other, the same teal and coral as the
 * otters' headband and wristbands. Thick outline so it sits next to them.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="17" r="9" fill="#12B4C6" stroke="#1E2A38" strokeWidth="3" />
      <circle cx="21" cy="14" r="9" fill="#FF6F59" stroke="#1E2A38" strokeWidth="3" />
      <path d="M 16.5 8.6 A 9 9 0 0 1 21 14" stroke="#1E2A38" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0" />
    </svg>
  );
}

export function Logo({
  withDescriptor = false,
  href = "/",
}: {
  withDescriptor?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="Pairspace home">
      <span className="transition-transform duration-300 group-hover:-rotate-6">
        <LogoMark />
      </span>
      <span className="flex items-baseline gap-2">
        <span
          className="text-[1.25rem] font-black tracking-[-0.01em] text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pairspace
        </span>
        {withDescriptor ? (
          <span className="hidden text-[0.75rem] font-bold text-ink-faint sm:inline">
            Participant Matching for Events
          </span>
        ) : null}
      </span>
    </Link>
  );
}
