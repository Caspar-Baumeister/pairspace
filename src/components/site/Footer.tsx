import Link from "next/link";

import { Logo } from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#product", label: "Inside the product" },
      { href: "/#matching", label: "How matching works" },
      { href: "/create", label: "Create your event" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { href: "/#use-cases", label: "Acro festivals" },
      { href: "/#use-cases", label: "Dance events" },
      { href: "/#use-cases", label: "Workshops and trainings" },
      { href: "/#use-cases", label: "Hackathons and teams" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/#privacy", label: "Privacy by design" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms" },
      { href: "/#faq", label: "Questions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface px-6 pb-10 pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[860px] -translate-x-1/2 opacity-60"
      >
        <svg viewBox="0 0 860 420" fill="none" className="h-full w-full">
          <circle cx="430" cy="420" r="180" stroke="var(--color-line)" />
          <circle cx="430" cy="420" r="290" stroke="var(--color-line)" />
          <circle cx="430" cy="420" r="400" stroke="var(--color-line)" />
          <path d="M250 420a180 180 0 0 1 90 -156" stroke="#2B4EF0" strokeOpacity="0.22" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="relative mx-auto grid w-full max-w-[1160px] gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[30ch] text-[0.875rem] leading-relaxed text-ink-muted">
            Participant matching for events. You provide the structure, participants do the
            partnering themselves.
          </p>
          <Link href="/create" className="btn btn-secondary btn-sm mt-6">
            Create your event
          </Link>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[0.875rem] text-ink-secondary transition-colors hover:text-blue"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mx-auto mt-16 flex w-full max-w-[1160px] flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] text-ink-faint">
          Pairspace. Participant matching for events, not a dating service and not a social network.
        </p>
        <p className="text-[0.8125rem] text-ink-faint">Come in pairs.</p>
      </div>
    </footer>
  );
}
