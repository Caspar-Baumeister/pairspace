"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useShell } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";

/** Opens the first flat, or the setup when there is none yet. */
export default function AppHome() {
  const { flats, flatsLoading } = useShell();
  const router = useRouter();

  useEffect(() => {
    if (flatsLoading) return;
    router.replace(flats.length ? `/app/w/${flats[0].id}` : "/app/neu");
  }, [flats, flatsLoading, router]);

  return <FullScreenSpinner />;
}
