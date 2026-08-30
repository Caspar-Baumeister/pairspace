const items = [
  "Acro festivals",
  "Dance weekends",
  "Partner workshops",
  "Climbing meetups",
  "Hackathons",
  "Language tandems",
  "Tennis tournaments",
  "Retreats",
];

export function ProofBand() {
  return (
    <section aria-label="Event types using participant matching" className="px-6 pb-6 pt-10">
      <p className="text-center text-[0.8125rem] text-ink-faint">
        Built for events where the right partner decides the experience
      </p>
      <div className="no-scrollbar mx-auto mt-6 flex max-w-[1000px] flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {items.map((i) => (
          <span
            key={i}
            className="text-[0.9375rem] font-medium tracking-[-0.015em] text-ink-faint transition-colors hover:text-ink-secondary"
          >
            {i}
          </span>
        ))}
      </div>
    </section>
  );
}
