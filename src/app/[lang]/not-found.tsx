"use client";

import Link from "next/link";

import { LogoMark } from "@/components/ui/Logo";
import { useLocalePath, useT } from "@/lib/i18n/client";

export default function NotFound() {
  const t = useT();
  const lp = useLocalePath();
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[380px] text-center">
        <div className="mx-auto flex justify-center text-faint">
          <LogoMark size={32} />
        </div>
        <h1 className="h3 mt-5">{t("Diese Seite gibt es nicht", "This page does not exist")}</h1>
        <p className="mt-2 text-muted">
          {t(
            "Wenn du einem Link zu einer Wohnung gefolgt bist, frag am besten bei der Person nach, die ihn dir geschickt hat.",
            "If you followed a link to a flat, best ask the person who sent it to you.",
          )}
        </p>
        <Link href={lp("/")} className="btn btn-lg mt-6">
          {t("Zur Startseite", "Go to the homepage")}
        </Link>
      </div>
    </div>
  );
}
