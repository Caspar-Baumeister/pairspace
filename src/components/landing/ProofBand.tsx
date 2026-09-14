const items = [
  "Acro festivals",
  "Dance weekends",
  "Partner workshops",
  "Climbing meetups",
  "Hackathons",
  "Language tandems",
  "Tennis tournaments",
  "Retreats",
  "Team sports",
];

export function ProofBand() {
  return (
    <section aria-label="Event types using participant matching" className="px-5 pb-4 pt-2 sm:px-6">
      <p className="text-center text-[0.875rem] font-extrabold uppercase tracking-[0.08em] text-ink-faint">
        Built for events where the right partner decides everything
      </p>
      <div className="no-scrollbar mt-5 flex gap-2.5 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {items.map((i, n) => (
          <span
            key={i}
            className="chip shrink-0"
            style={{
              background: n % 3 === 0 ? "var(--color-accent-soft)" : n % 3 === 1 ? "var(--color-sun-soft)" : "var(--color-coral-soft)",
              color: "var(--color-ink)",
              cursor: "default",
            }}
          >
            {i}
          </span>
        ))}
      </div>
    </section>
  );
}
