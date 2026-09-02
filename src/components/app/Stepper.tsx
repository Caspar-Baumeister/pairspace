export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex-1">
              <div
                className="h-[3px] rounded-full transition-colors duration-300"
                style={{
                  background:
                    state === "todo" ? "var(--color-line)" : "var(--color-accent)",
                  opacity: state === "current" ? 1 : state === "done" ? 0.45 : 1,
                }}
              />
              <p
                className={`mt-2 text-[0.75rem] ${
                  state === "current" ? "font-medium text-ink" : "text-ink-faint"
                }`}
              >
                {label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
