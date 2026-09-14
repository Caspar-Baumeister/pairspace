import { MascotWave } from "@/components/mascot/Scenes";
import { Reveal } from "./Reveal";

const pairs = [
  { no: "Not a dating app", yes: "Participants pair up for an activity at one event. The categories are roles, not preferences." },
  { no: "Not a social network", yes: "No feed, no followers, no public directory of people." },
  { no: "Not an app download", yes: "The event link opens in the browser participants already have." },
  { no: "Not a permanent account", yes: "A profile belongs to one event and is deleted after the window you choose." },
  { no: "Not event management software", yes: "No ticketing, no schedules, no invoices. One job, done properly." },
];

export function Boundaries() {
  return (
    <section id="privacy" className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid w-full max-w-[960px] gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <p className="eyebrow">Clear boundaries</p>
          <h2 className="display-l mt-3 max-w-[14ch] text-balance">What this is, and what it never becomes.</h2>
          <p className="mt-4 max-w-[40ch] text-[1.0625rem] font-medium leading-relaxed text-ink-muted">
            Participants share their details because the edges are obvious. Keeping them narrow is a
            product decision, not a policy page.
          </p>

          <div className="mt-8 flex items-end gap-3">
            <div className="w-24 shrink-0">
              <MascotWave className="w-full" label="Kai waves" />
            </div>
            <div className="speech mb-4 text-[0.9375rem]">We pair you up for the jam. Not for life.</div>
          </div>
        </Reveal>

        <Reveal delay={70}>
          <ul className="card divide-y-2 divide-line p-2">
            {pairs.map((p) => (
              <li key={p.no} className="flex gap-4 p-4">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral-deep"
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-[1.0625rem] font-extrabold text-ink">{p.no}</p>
                  <p className="mt-1 text-[0.9375rem] font-medium leading-relaxed text-ink-muted">{p.yes}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
