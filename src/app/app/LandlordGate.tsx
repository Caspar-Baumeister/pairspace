"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { AppShell } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/firebase/auth";
import { ensureLandlord } from "@/lib/firebase/data";

/** Only permanent accounts get in. Anonymous applicant sessions are sent to sign in. */
export function LandlordGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const ensured = useRef<string | null>(null);

  const allowed = Boolean(user && !user.isAnonymous);

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      router.replace(`/anmelden?weiter=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user && ensured.current !== user.uid) {
      ensured.current = user.uid;
      ensureLandlord(user).catch((e) => console.error("ensureLandlord", e));
    }
  }, [loading, allowed, user, router, pathname]);

  if (loading || !allowed) return <FullScreenSpinner />;
  return <AppShell>{children}</AppShell>;
}
