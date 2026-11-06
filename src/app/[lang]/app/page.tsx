"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useShell } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useLocalePath } from "@/lib/i18n/client";

/** Opens the flat opened last (or the first), or the setup when there is none yet. */
export default function AppHome() {
  const { selectedFlat, flatsLoading } = useShell();
  const router = useRouter();
  const lp = useLocalePath();

  useEffect(() => {
    if (flatsLoading) return;
    router.replace(lp(selectedFlat ? `/app/w/${selectedFlat.id}` : "/app/neu"));
  }, [selectedFlat, flatsLoading, router, lp]);

  return <FullScreenSpinner />;
}
