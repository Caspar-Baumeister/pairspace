"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/firebase/auth";
import { Logo } from "./Logo";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#product", label: "Product" },
  { href: "/#use-cases", label: "Use cases" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#faq", label: "Questions" },
];

export function Nav() {
  const { user, isAnonymous } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signedIn = Boolean(user) && !isAnonymous;

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 w-full max-w-[1160px] items-center justify-between rounded-full border border-line bg-surface/85 pl-5 pr-2 backdrop-blur-xl transition-shadow duration-300"
        style={{ boxShadow: scrolled ? "var(--shadow-md)" : "var(--shadow-xs)" }}
      >
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[0.875rem] font-medium text-ink-secondary transition-colors hover:bg-sunken hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={signedIn ? "/dashboard" : "/signin"}
            className="hidden rounded-full px-3.5 py-2 text-[0.875rem] font-medium text-ink-secondary transition-colors hover:bg-sunken hover:text-ink sm:block"
          >
            {signedIn ? "My events" : "Sign in"}
          </Link>
          <Link href="/create" className="btn btn-primary btn-sm">
            Create your event
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d={open ? "M4 4l10 10M14 4L4 14" : "M2 5h14M2 12h14"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mx-auto mt-2 w-full max-w-[1160px] rounded-3xl border border-line bg-surface p-2 shadow-[var(--shadow-md)] lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-[0.9375rem] font-medium text-ink-secondary hover:bg-sunken"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={signedIn ? "/dashboard" : "/signin"}
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-[0.9375rem] font-medium text-ink-secondary hover:bg-sunken"
          >
            {signedIn ? "My events" : "Sign in"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
