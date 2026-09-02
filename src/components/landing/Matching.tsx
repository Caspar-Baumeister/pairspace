import { castAvatar } from "@/lib/avatar";
import { Reveal } from "./Reveal";

const rings = [
  { r: 58, label: "You" },
  { r: 108, label: "Looking for each other" },
  { r: 158, label: "Same level and days" },
  { r: 208, label: "Also at this event" },
];

export function Matching() {
  return (
    <section id="matching" className="relative overflow-hidden bg-surface px-6 py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-[1100px] items-center gap-16 lg:grid-cols-[1fr_0.9fr]">
        <Reveal>
          <p className="eyebrow">How matching works</p>
          <h2 className="display-l mt-4 max-w-[15ch] text-balance">
            Explainable matching, never a black box.
          </h2>
          <p className="mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-ink-muted">
            Every participant says what they are and what they are looking for. Pairspace ranks the
            people who fit and shows the reason next to each name, so nobody has to trust a score
            they cannot see.
          </p>

          <dl className="mt-10 max-w-[46ch] divide-y divide-line border-y border-line">
            {[
              {
                t: "Category fit",
                d: "A Flyer looking for a Base sits above someone looking for the same role as you.",
              },
              {
                t: "Shared answers",
                d: "Level, availability and any question you marked as relevant move people up.",
              },
              {
                t: "Still open",
                d: "Participants who already found a partner drop down and are labelled clearly.",
              },
            ].map((row) => (
              <div key={row.t} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:gap-6">
                <dt className="shrink-0 text-[0.9375rem] font-medium text-ink sm:w-[9.5rem]">
                  {row.t}
                </dt>
                <dd className="text-[0.9375rem] leading-relaxed text-ink-muted">{row.d}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={80}>
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            <svg viewBox="0 0 440 440" fill="none" className="h-full w-full">
              {rings.map((ring, i) => (
                <circle
                  key={ring.r}
                  cx="220"
                  cy="220"
                  r={ring.r}
                  stroke={i === 1 ? "#0D8A5E" : "var(--color-line)"}
                  strokeOpacity={i === 1 ? 0.35 : 1}
                  strokeWidth={i === 1 ? 1.6 : 1}
                />
              ))}
              <circle cx="220" cy="220" r="26" fill="#0A0A0B" />
              <text
                x="220"
                y="225"
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontFamily="var(--font-display)"
                fontWeight="600"
              >
                You
              </text>

              {[
                { x: 328, y: 220, label: "Leo", seed: "leo-fischer", role: "Base", tint: "#E7F4EE" },
                { x: 148, y: 132, label: "Sara", seed: "sara-lindqvist", role: "Flyer", tint: "#F1EDFE" },
                { x: 296, y: 342, label: "Emma", seed: "emma-nielsen", role: "Both", tint: "#F4F4F5" },
                { x: 112, y: 316, label: "Nora", seed: "nora-castillo", role: "Base", tint: "#EAF6F8" },
              ].map((p) => (
                <g key={p.label}>
                  <clipPath id={`clip-${p.seed}`}>
                    <circle cx={p.x} cy={p.y} r="26" />
                  </clipPath>
                  <circle cx={p.x} cy={p.y} r="26" fill={p.tint} stroke="var(--color-line)" />
                  <image
                    href={castAvatar(p.seed)}
                    x={p.x - 28}
                    y={p.y - 26}
                    width="56"
                    height="56"
                    clipPath={`url(#clip-${p.seed})`}
                    preserveAspectRatio="xMidYMin slice"
                  />
                  <circle cx={p.x} cy={p.y} r="26" fill="none" stroke="var(--color-line)" />
                  <text
                    x={p.x}
                    y={p.y + 44}
                    textAnchor="middle"
                    fill="var(--color-ink)"
                    fontSize="12"
                    fontFamily="var(--font-display)"
                    fontWeight="600"
                  >
                    {p.label}
                  </text>
                  <text
                    x={p.x}
                    y={p.y + 60}
                    textAnchor="middle"
                    fill="var(--color-ink-faint)"
                    fontSize="11"
                  >
                    {p.role}
                  </text>
                </g>
              ))}

              <line x1="246" y1="220" x2="302" y2="220" stroke="#0D8A5E" strokeOpacity="0.4" />
              <line x1="204" y1="199" x2="166" y2="152" stroke="#0D8A5E" strokeOpacity="0.4" />
            </svg>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
              {rings.slice(1).map((ring, i) => (
                <li key={ring.label} className="flex items-center gap-2 text-[0.8125rem] text-ink-muted">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: i === 0 ? "#0D8A5E" : "var(--color-line-strong)" }}
                    aria-hidden="true"
                  />
                  {ring.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
