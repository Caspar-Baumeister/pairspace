import Link from "next/link";

import { Reveal } from "./Reveal";

const X_URL = "https://x.com/CasparBaumeist2";

const ideas = [
  {
    title: "Permanent profiles",
    body: "Keep one participant profile and reuse it across events instead of filling the form again.",
  },
  {
    title: "Recurring events",
    body: "One link for your weekly class or monthly jam that resets itself for every edition.",
  },
  {
    title: "Your own branding",
    body: "Your logo and colors on the event page, so the link feels like part of your event.",
  },
];

export function Feedback() {
  return (
    <section id="feedback" className="relative overflow-x-clip px-6 py-24 sm:py-32">
      <Reveal className="mx-auto max-w-[820px] text-center">
        <p className="eyebrow">Help shape Pairspace</p>
        <h2 className="display-l mt-4 text-balance">Tell me what to build next.</h2>
        <p className="body-l mx-auto mt-5 max-w-[52ch]">
          Pairspace is built by one person, and it gets better with every organizer who talks back.
          Something confusing? Something missing? Write me on X.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary w-full sm:w-auto"
          >
            <XGlyph />
            Write @CasparBaumeist2
          </a>
        </div>
        <p className="mt-4 text-[0.875rem] text-ink-faint">Caspar Baumeister, maker of Pairspace</p>
      </Reveal>

      <div className="mx-auto mt-16 w-full max-w-[1100px]">
        <Reveal delay={60}>
          <p className="text-center text-[0.875rem] font-medium text-ink-secondary">
            Already on my list. Want one of these? Say so and I will build it sooner.
          </p>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {ideas.map((idea, i) => (
            <Reveal key={idea.title} delay={90 + i * 60}>
              <div className="card h-full p-6">
                <p className="text-[1rem] font-semibold tracking-[-0.01em] text-ink">{idea.title}</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{idea.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mx-auto mt-8 max-w-[52ch] text-center text-[0.9375rem] text-ink-muted">
            Have a different request? I am happy to implement it. And if you have not yet,{" "}
            <Link href="/create" className="font-medium text-accent hover:text-accent-hover">
              create your event
            </Link>{" "}
            first, it is free.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function XGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
