"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { AppShell } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/firebase/auth";
import { ensureLandlord } from "@/lib/firebase/data";
import { basePath } from "@/lib/i18n";
import { useLocale, useLocalePath } from "@/lib/i18n/client";

/** Only permanent accounts get in. Anonymous applicant sessions are sent to sign in. */
export function LandlordGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const lp = useLocalePath();
  const locale = useLocale();
  const ensured = useRef<string | null>(null);

  const allowed = Boolean(user && !user.isAnonymous);

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      // weiter carries the path without language prefix, sign in adds it back.
      router.replace(lp(`/anmelden?weiter=${encodeURIComponent(basePath(pathname))}`));
      return;
    }
    // Again after a language switch, so their mails follow the app language.
    if (user && ensured.current !== `${user.uid}:${locale}`) {
      ensured.current = `${user.uid}:${locale}`;
      ensureLandlord(user, undefined, locale).catch((e) => console.error("ensureLandlord", e));
    }
  }, [loading, allowed, user, router, pathname, lp, locale]);

  if (loading || !allowed) return <FullScreenSpinner />;
  return <AppShell>{children}</AppShell>;
}
