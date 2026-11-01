import Link from "next/link";

/** Three linked nodes, a tiny version of the graph view. */
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.5 16.5 12 6.5l5.5 10z" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
      <circle cx="12" cy="6.5" r="3" fill="var(--color-accent)" />
      <circle cx="6.5" cy="16.5" r="3" fill="currentColor" />
      <circle cx="17.5" cy="16.5" r="3" fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-ink">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">Pairspace</span>
    </Link>
  );
}
