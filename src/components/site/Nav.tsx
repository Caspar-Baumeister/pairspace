"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/firebase/auth";
import { Logo } from "./Logo";

export function Nav() {
  const { user, isAnonymous } = useAuth();
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
        className="mx-auto flex h-14 w-full max-w-[1160px] items-center justify-between gap-3 rounded-full border border-line bg-surface/85 pl-4 pr-1.5 backdrop-blur-xl transition-shadow duration-300 sm:pl-5 sm:pr-2"
        style={{ boxShadow: scrolled ? "var(--shadow-md)" : "var(--shadow-xs)" }}
      >
        <Logo />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href={signedIn ? "/dashboard" : "/signin"}
            className="whitespace-nowrap rounded-full px-3 py-2 text-[0.875rem] font-medium text-ink-secondary transition-colors hover:bg-sunken hover:text-ink sm:px-3.5"
          >
            {signedIn ? "My events" : "Sign in"}
          </Link>
          <Link href="/create" className="btn btn-primary btn-sm">
            <span className="sm:hidden">Create event</span>
            <span className="hidden sm:inline">Create your event</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
