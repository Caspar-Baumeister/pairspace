import Link from "next/link";

import { MascotPeek } from "@/components/mascot/Scenes";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#use-cases", label: "Use cases" },
      { href: "/#faq", label: "Questions" },
      { href: "/create", label: "Create your event" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/#privacy", label: "What it is not" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms" },
      { href: "/#feedback", label: "Feedback" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t-2 border-line bg-sunken px-6 pb-8 pt-16">
      <div className="pointer-events-none absolute -top-[2px] right-6 w-20 sm:right-16 sm:w-24" aria-hidden="true">
        <div className="translate-y-[-100%]">
          <MascotPeek className="w-full" />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1120px] gap-10 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[30ch] text-[0.9375rem] font-semibold leading-relaxed text-ink-muted">
            Participant matching for events. You set up the space, participants find each other.
          </p>
          <Link href="/create" className="btn btn-secondary btn-sm mt-6">
            Create your event
          </Link>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[0.9375rem] font-bold text-ink-secondary transition-colors hover:text-accent-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-[1120px] flex-col gap-2 border-t-2 border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] font-semibold text-ink-faint">
          Pairspace. Not a dating service, not a social network. Just partners for your event.
        </p>
        <p className="text-[0.8125rem] font-extrabold text-ink-muted">Come in pairs.</p>
      </div>
    </footer>
  );
}
