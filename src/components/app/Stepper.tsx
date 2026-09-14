export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const pct = Math.round(((current + 1) / steps.length) * 100);
  return (
    <div aria-label="Progress" role="group">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.875rem] font-extrabold uppercase tracking-[0.06em] text-ink-muted">
          Step {current + 1} of {steps.length}
        </p>
        <p className="text-[0.875rem] font-extrabold text-accent-deep">{steps[current]}</p>
      </div>
      <div className="progress mt-2.5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
