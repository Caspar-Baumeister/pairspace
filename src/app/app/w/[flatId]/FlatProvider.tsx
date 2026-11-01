"use client";

import { House } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";

import { PaneBody, PaneHeader } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/firebase/auth";
import { useFlat } from "@/lib/firebase/data";
import type { Flat } from "@/lib/types";

const FlatCtx = createContext<Flat | null>(null);

export function useCurrentFlat(): Flat {
  const flat = useContext(FlatCtx);
  if (!flat) throw new Error("useCurrentFlat must be used inside FlatProvider");
  return flat;
}

export function FlatProvider({ flatId, children }: { flatId: string; children: ReactNode }) {
  const { user } = useAuth();
  const flat = useFlat(flatId);

  if (flat.loading) return <FullScreenSpinner />;
  if (!flat.data || flat.data.ownerUid !== user?.uid) {
    return (
      <>
        <PaneHeader icon={House} title="Nicht gefunden" />
        <PaneBody>
          <h1 className="h2">Diese Wohnung gibt es nicht</h1>
          <p className="mt-3 text-muted">Vielleicht wurde sie gelöscht, oder sie gehört zu einem anderen Konto.</p>
          <Link href="/app" className="btn mt-6">
            Zu meinen Wohnungen
          </Link>
        </PaneBody>
      </>
    );
  }
  return <FlatCtx.Provider value={flat.data}>{children}</FlatCtx.Provider>;
}
