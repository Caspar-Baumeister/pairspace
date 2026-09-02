import { Reveal } from "./Reveal";

const cases = [
  {
    title: "Acro festivals",
    line: "Bases and Flyers of matching level and height, sorted before the first jam.",
  },
  { title: "Dance events", line: "Leaders and Followers balanced across every day of the weekend." },
  { title: "Workshops", line: "Practice partners for a technique block, chosen by the group itself." },
  { title: "Competitions", line: "Teams that still need one person in a specific role." },
  { title: "Tournaments", line: "Doubles pairings arranged by the players, not by the desk." },
  { title: "Retreats", line: "Room shares, buddy systems and practice pairs for a full week." },
  { title: "Hackathons", line: "Builders, designers and domain experts forming teams before day one." },
  { title: "Community events", line: "Language tandems, running partners, mentoring pairs." },
];

export function UseCases() {
  return (
    <section id="use-cases" className="relative overflow-hidden bg-surface px-6 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2"
      >
        <svg viewBox="0 0 900 900" fill="none" className="h-full w-full">
          {[180, 300, 420].map((r) => (
            <circle key={r} cx="450" cy="450" r={r} stroke="var(--color-line)" />
          ))}
          <path
            d="M450 30 A420 420 0 0 1 747 153"
            stroke="#0D8A5E"
            strokeOpacity="0.2"
            strokeWidth="1.6"
          />
        </svg>
      </div>

      <div className="relative mx-auto w-full max-w-[1000px]">
        <Reveal className="max-w-[640px]">
          <p className="eyebrow">Where it is used</p>
          <h2 className="display-l mt-4 max-w-[16ch] text-balance">
            Anywhere people arrive alone and leave in pairs.
          </h2>
        </Reveal>

        <Reveal delay={60}>
          <ul className="mt-14 divide-y divide-line border-y border-line">
            {cases.map((c, i) => (
              <li
                key={c.title}
                className="group flex flex-col gap-1.5 py-5 transition-colors sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span
                  className="tnum w-8 shrink-0 text-[0.8125rem] font-semibold text-ink-faint transition-colors group-hover:text-accent"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="w-[13rem] shrink-0 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
                  {c.title}
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-ink-muted">{c.line}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
