import Link from "next/link";

import { Reveal } from "./Reveal";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[1200px] -translate-x-1/2 -translate-y-1/2"
      >
        <svg viewBox="0 0 1200 820" fill="none" className="h-full w-full">
          {[200, 320, 440].map((r) => (
            <circle key={r} cx="600" cy="410" r={r} stroke="var(--color-line)" />
          ))}
          <path
            d="M600 -30 A440 440 0 0 1 911 100"
            stroke="#2B4EF0"
            strokeOpacity="0.18"
            strokeWidth="1.6"
          />
        </svg>
      </div>

      <Reveal className="relative mx-auto max-w-[760px] text-center">
        <p className="eyebrow">Come in pairs</p>
        <h2 className="display-l mt-5 text-balance">
          Your participants are already coming. Help them find each other.
        </h2>
        <p className="body-l mx-auto mt-6 max-w-[46ch]">
          Set up your event in two minutes, share the link, and let the partnering happen on its own.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/create" className="btn btn-primary w-full sm:w-auto">
            Create your event
          </Link>
          <Link href="#how-it-works" className="btn btn-secondary w-full sm:w-auto">
            See how it works
          </Link>
        </div>
        <p className="mt-5 text-[0.875rem] text-ink-faint">
          Free to create. Sign in with Google or Apple at the end to keep your link.
        </p>
      </Reveal>
    </section>
  );
}
