export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-faint" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function FullScreenSpinner({ label = "Einen Moment" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center gap-3 text-ui-small text-faint" role="status">
      <Spinner />
      {label}
    </div>
  );
}
