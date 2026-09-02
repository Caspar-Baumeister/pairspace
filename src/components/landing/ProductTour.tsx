import { MockNotifyMe, MockOrganizerStats } from "./Mocks";
import { Reveal } from "./Reveal";

export function ProductTour() {
  return (
    <section id="product" className="relative px-6 py-24 sm:py-32">
      <Reveal className="mx-auto max-w-[880px]">
        <p className="eyebrow">Inside the product</p>
        <h2 className="display-l mt-4 max-w-[18ch] text-balance">
          Two ways in for participants. One clear view for you.
        </h2>
      </Reveal>

      <div className="mx-auto mt-16 grid w-full max-w-[1100px] gap-6 lg:grid-cols-[1.05fr_1fr]">
        <Reveal className="h-full">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-8">
            <div>
              <h3 className="heading">Participants who want to browse</h3>
              <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                A temporary event profile takes under a minute. First name, category, what they are
                looking for, and the answers you asked for. Then they see who fits and send one
                request.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "No download, the link opens in the browser",
                  "No password, the profile lives in this event only",
                  "Contact details are exchanged only when both sides agree",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[0.9375rem] text-ink-secondary">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      className="mt-[3px] shrink-0"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="9" r="8.25" stroke="var(--color-accent-line)" />
                      <path
                        d="M5.6 9.2l2.3 2.2 4.5-4.6"
                        stroke="var(--color-accent)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-10 text-[0.8125rem] text-ink-faint">
              Participant view, mobile first, works offline of any app store.
            </p>
          </div>
        </Reveal>

        <Reveal delay={70}>
          <MockNotifyMe />
        </Reveal>

        <Reveal delay={110} className="lg:col-span-2">
          <div className="grid gap-6 rounded-2xl border border-line bg-sunken p-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Organizer dashboard</p>
              <h3 className="display-m mt-3 max-w-[14ch] text-balance">
                See who is still open, in real time.
              </h3>
              <p className="mt-5 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                Every event keeps a live count of participants, open requests and connections made,
                plus the balance between your categories. When your Flyers outnumber your Bases you
                see it before the weekend starts, not after.
              </p>
              <p className="mt-6 max-w-[44ch] text-[0.9375rem] text-ink-muted">
                Past events stay in your history with their final numbers, so the next edition
                starts from something real.
              </p>
            </div>
            <div className="lg:pl-6">
              <MockOrganizerStats />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
