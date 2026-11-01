import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-2 px-4 md:px-6">
        <Logo />
        <div className="flex-1" />
        <Link href="/preise" className="btn btn-ghost hidden sm:inline-flex">
          Preise
        </Link>
        <Link href="/anmelden" className="btn btn-ghost">
          Anmelden
        </Link>
        <Link href="/anmelden?neu=1" className="btn btn-cta">
          Kostenlos testen
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-8 text-ui-small text-faint md:px-6">
        <span>© {new Date().getFullYear()} Pairspace</span>
        <Link href="/preise" className="hover:text-ink">
          Preise
        </Link>
        <Link href="/anmelden" className="hover:text-ink">
          Anmelden
        </Link>
      </div>
    </footer>
  );
}
