import { MockEventSetup, MockParticipantList, MockShareLink } from "./Mocks";
import { Reveal } from "./Reveal";

const steps = [
  {
    n: "01",
    eyebrow: "Event creator",
    title: "Create your event",
    body: "Pick your categories and questions. Base or Flyer, level, availability, or your own.",
    mock: <MockEventSetup />,
  },
  {
    n: "02",
    eyebrow: "One link",
    title: "Get a link and QR code",
    body: "Instantly and for free. Share it anywhere, participants open it in the browser.",
    mock: <MockShareLink />,
  },
  {
    n: "03",
    eyebrow: "Participants",
    title: "Participants pair up",
    body: "They join with a temporary profile and find each other. No app, no account.",
    mock: <MockParticipantList />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-x-clip px-6 py-24 sm:py-32">
      <Reveal className="mx-auto max-w-[820px] text-center">
        <p className="eyebrow">Built around one real event</p>
        <h2 className="display-l mt-4 text-balance">
          Set up the space.
          <br />
          Let people find each other.
        </h2>
        <p className="body-l mx-auto mt-5 max-w-[52ch]">
          You provide the structure. Participants do the partnering themselves.
        </p>
      </Reveal>

      <div className="mx-auto mt-20 w-full max-w-[1100px] space-y-6">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 60}>
            <div className="hairline pt-14 first:border-0 first:pt-0">
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="min-w-0">
                  <p
                    className="tnum text-[0.9375rem] font-semibold text-accent"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.n}
                  </p>
                  <p className="mt-10 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {s.eyebrow}
                  </p>
                  <h3 className="display-m mt-3 max-w-[16ch] text-balance">{s.title}</h3>
                  <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                    {s.body}
                  </p>
                </div>
                <div className="relative min-w-0">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-16 -z-10"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(13,138,94,0.07), rgba(13,138,94,0))",
                    }}
                  />
                  {s.mock}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
