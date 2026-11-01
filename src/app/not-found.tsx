import Link from "next/link";

import { LogoMark } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[380px] text-center">
        <div className="mx-auto flex justify-center text-faint">
          <LogoMark size={32} />
        </div>
        <h1 className="h3 mt-5">Diese Seite gibt es nicht</h1>
        <p className="mt-2 text-muted">
          Wenn du einem Link zu einer Wohnung gefolgt bist, frag am besten bei der Person nach, die ihn dir geschickt hat.
        </p>
        <Link href="/" className="btn btn-lg mt-6">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
