import Link from "next/link";

import { Logo } from "@/components/site/Logo";

export function AppShell({
  children,
  right,
  wide = false,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1160px] items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </header>
      <main
        id="main"
        className={`mx-auto w-full px-5 pb-24 pt-10 ${wide ? "max-w-[1160px]" : "max-w-[720px]"}`}
      >
        {children}
      </main>
      <footer className="border-t border-line px-5 py-6">
        <div className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-3">
          <p className="text-[0.8125rem] text-ink-faint">
            Pairspace, participant matching for events.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-[0.8125rem] text-ink-faint hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-[0.8125rem] text-ink-faint hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
