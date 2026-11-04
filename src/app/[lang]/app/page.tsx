"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useShell } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useLocalePath } from "@/lib/i18n/client";

/** Opens the first flat, or the setup when there is none yet. */
export default function AppHome() {
  const { flats, flatsLoading } = useShell();
  const router = useRouter();
  const lp = useLocalePath();

  useEffect(() => {
    if (flatsLoading) return;
    router.replace(lp(flats.length ? `/app/w/${flats[0].id}` : "/app/neu"));
  }, [flats, flatsLoading, router, lp]);

  return <FullScreenSpinner />;
}
