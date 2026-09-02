import Link from "next/link";

export function Logo({
  withDescriptor = false,
  href = "/",
}: {
  withDescriptor?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="Pairspace home">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="10" cy="13" r="7.2" stroke="#0A0A0B" strokeWidth="2.4" />
        <circle
          cx="16"
          cy="13"
          r="7.2"
          stroke="#0D8A5E"
          strokeWidth="2.4"
          className="transition-transform duration-500 group-hover:translate-x-[1.5px]"
        />
      </svg>
      <span className="flex items-baseline gap-2">
        <span
          className="text-[1.0625rem] font-semibold tracking-[-0.03em] text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pairspace
        </span>
        {withDescriptor ? (
          <span className="hidden text-[0.75rem] font-medium text-ink-faint sm:inline">
            Participant Matching for Events
          </span>
        ) : null}
      </span>
    </Link>
  );
}
