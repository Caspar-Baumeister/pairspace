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
    <div className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-3 rounded-[22px] border-2 border-line bg-surface/92 pl-4 pr-2 backdrop-blur-xl transition-shadow duration-300 sm:pl-5"
        style={{ boxShadow: scrolled ? "0 4px 0 var(--color-line), var(--shadow-md)" : "0 4px 0 var(--color-line)" }}
      >
        <Logo />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href={signedIn ? "/dashboard" : "/signin"}
            className="whitespace-nowrap rounded-xl px-3 py-2 text-[0.9375rem] font-extrabold text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
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
