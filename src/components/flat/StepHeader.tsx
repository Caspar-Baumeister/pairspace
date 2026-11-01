/** Progress bar plus title for the setup steps. */
export function StepHeader({ step, total, title, text }: { step: number; total: number; title: string; text?: string }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-[3px] flex-1 rounded-full ${i < step ? "bg-accent" : "bg-base-30"}`} />
          ))}
        </div>
        <span className="text-ui-smaller tabular-nums text-faint">
          {step} von {total}
        </span>
      </div>
      <h1 className="h2 mt-6">{title}</h1>
      {text ? <p className="mt-2 text-muted">{text}</p> : null}
    </div>
  );
}
