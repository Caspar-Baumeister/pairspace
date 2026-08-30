import { MockEventSetup, MockParticipantList, MockShareLink } from "./Mocks";
import { Reveal } from "./Reveal";

const steps = [
  {
    n: "01",
    eyebrow: "Event creator",
    title: "Create your event and participant categories",
    body: "Define what matters at your event: Base or Flyer, Leader or Follower, role, level, availability, team size, or your own categories. Add the questions participants should answer and mark which ones count for matching.",
    aside: "Takes about two minutes. No credit card, no setup call.",
    mock: <MockEventSetup />,
  },
  {
    n: "02",
    eyebrow: "One link",
    title: "Share one simple link",
    body: "You get a single link for this event. Put it in your WhatsApp group, your confirmation email, or on your event website. Participants open it in the browser they already have.",
    aside: "The link is the whole distribution. Nothing to install, nothing to approve.",
    mock: <MockShareLink />,
  },
  {
    n: "03",
    eyebrow: "Participants",
    title: "Let participants join or activate notifications",
    body: "Everyone chooses their own path. Create a temporary event profile and browse who else is looking, or skip the profile entirely and leave an email address to hear about it when a suitable partner joins.",
    aside: "Profiles live inside this one event and disappear afterwards.",
    mock: <MockParticipantList />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24 sm:py-32">
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
                <div>
                  <p
                    className="tnum text-[0.9375rem] font-semibold text-blue"
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
                  <p className="mt-6 flex items-start gap-2.5 text-[0.875rem] text-ink-faint">
                    <span
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue"
                      aria-hidden="true"
                    />
                    {s.aside}
                  </p>
                </div>
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-16 -z-10"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(43,78,240,0.07), rgba(43,78,240,0))",
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
