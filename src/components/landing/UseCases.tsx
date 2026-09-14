import { Reveal } from "./Reveal";

const cases = [
  { title: "Acro festivals", line: "Bases and Flyers of matching level, sorted before the first jam.", tint: "var(--color-accent-soft)" },
  { title: "Dance events", line: "Leaders and Followers balanced across the whole weekend.", tint: "var(--color-coral-soft)" },
  { title: "Workshops", line: "Practice partners for a technique block, chosen by the group itself.", tint: "var(--color-sun-soft)" },
  { title: "Competitions", line: "Teams that still need one person in a specific role.", tint: "var(--color-positive-soft)" },
  { title: "Tournaments", line: "Doubles pairings arranged by the players, not by the desk.", tint: "var(--color-sun-soft)" },
  { title: "Retreats", line: "Room shares, buddy systems and practice pairs for a full week.", tint: "var(--color-accent-soft)" },
  { title: "Hackathons", line: "Builders, designers and domain experts forming teams before day one.", tint: "var(--color-coral-soft)" },
  { title: "Community events", line: "Language tandems, running partners, mentoring pairs.", tint: "var(--color-positive-soft)" },
];

export function UseCases() {
  return (
    <section id="use-cases" className="bg-sunken px-5 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-[720px] text-center">
        <p className="eyebrow">Where it is used</p>
        <h2 className="display-l mt-3 text-balance">Anywhere people arrive alone and leave in pairs.</h2>
      </Reveal>

      <Reveal delay={60}>
        <ul className="mx-auto mt-12 grid w-full max-w-[960px] gap-4 sm:grid-cols-2">
          {cases.map((c) => (
            <li key={c.title} className="card flex items-start gap-4 p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[1.25rem] font-black text-ink"
                style={{ background: c.tint }}
                aria-hidden="true"
              >
                {c.title[0]}
              </span>
              <div>
                <p className="text-[1.0625rem] font-extrabold text-ink">{c.title}</p>
                <p className="mt-1 text-[0.9375rem] font-medium leading-relaxed text-ink-muted">{c.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
