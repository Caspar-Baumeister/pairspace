import { Reveal } from "./Reveal";

const pairs = [
  {
    no: "Not a dating app",
    yes: "Participants partner up for an activity at one event. The categories are roles, not preferences.",
  },
  {
    no: "Not a social network",
    yes: "There is no feed, no follower count and no public directory of people.",
  },
  {
    no: "Not an app download",
    yes: "The event link opens in the browser participants already use.",
  },
  {
    no: "Not a permanent account",
    yes: "A profile belongs to one event and is removed after the retention window you choose.",
  },
  {
    no: "Not event management software",
    yes: "No ticketing, no schedules, no invoices. One job, done properly.",
  },
];

export function Boundaries() {
  return (
    <section id="privacy" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-[1100px] gap-16 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <p className="eyebrow">Clear boundaries</p>
          <h2 className="display-l mt-4 max-w-[13ch] text-balance">
            What this is, and what it never becomes.
          </h2>
          <p className="mt-6 max-w-[40ch] text-[1.0625rem] leading-relaxed text-ink-muted">
            Participants share data because the boundaries are obvious. Keeping them narrow is a
            product decision, not a policy page.
          </p>

          <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Data retention
            </p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-secondary">
              You pick how long profiles stay after the event ends. When that window closes, every
              participant profile, email address and connection for the event is deleted
              automatically.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["7 days", "30 days", "90 days"].map((d, i) => (
                <span key={d} className="chip" data-active={i === 1}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={70}>
          <ul className="divide-y divide-line border-y border-line">
            {pairs.map((p) => (
              <li key={p.no} className="grid gap-3 py-6 sm:grid-cols-[15rem_1fr] sm:gap-8">
                <div className="flex items-start gap-2.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="mt-[3px] shrink-0"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="9" r="8.25" stroke="var(--color-line-strong)" />
                    <path
                      d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6"
                      stroke="var(--color-ink-faint)"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                    {p.no}
                  </span>
                </div>
                <p className="text-[0.9375rem] leading-relaxed text-ink-muted">{p.yes}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
