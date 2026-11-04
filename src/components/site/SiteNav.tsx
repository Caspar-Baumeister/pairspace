"use client";

import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { track } from "@/lib/analytics";
import { useLocalePath, useT } from "@/lib/i18n/client";

import { LanguageSwitch } from "./LanguageSwitch";

export function SiteNav() {
  const t = useT();
  const lp = useLocalePath();
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-4 md:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 sm:flex">
          <Link href={lp("/#video")} className="btn btn-ghost">
            Video
          </Link>
          <Link href={lp("/preise")} className="btn btn-ghost">
            {t("Preise", "Pricing")}
          </Link>
        </nav>
        <div className="flex-1" />
        <LanguageSwitch source="nav" className="mr-1 max-sm:hidden" />
        <Link href={lp("/anmelden")} className="btn btn-ghost max-[400px]:hidden">
          {t("Anmelden", "Sign in")}
        </Link>
        <Link href={lp("/anmelden?neu=1")} className="btn btn-cta" onClick={() => track("cta_clicked", { location: "nav" })}>
          {t("Kostenlos testen", "Try for free")}
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const t = useT();
  const lp = useLocalePath();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-8 text-ui-small text-faint md:px-6">
        <span>© {new Date().getFullYear()} Pairspace</span>
        <Link href={lp("/preise")} className="hover:text-ink">
          {t("Preise", "Pricing")}
        </Link>
        <Link href={lp("/anmelden")} className="hover:text-ink">
          {t("Anmelden", "Sign in")}
        </Link>
        <div className="flex-1" />
        <LanguageSwitch source="footer" />
      </div>
    </footer>
  );
}
