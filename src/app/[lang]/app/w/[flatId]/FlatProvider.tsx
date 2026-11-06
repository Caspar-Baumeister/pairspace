"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";

import { PaneBody, PaneHeader } from "@/components/app/AppShell";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/firebase/auth";
import { useFlat } from "@/lib/firebase/data";
import { useLocalePath, useT } from "@/lib/i18n/client";
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
  const t = useT();
  const lp = useLocalePath();

  if (flat.loading) return <FullScreenSpinner />;
  if (!flat.data || flat.data.ownerUid !== user?.uid) {
    return (
      <>
        <PaneHeader />
        <PaneBody>
          <h1 className="h2">{t("Diese Wohnung gibt es nicht", "This flat doesn't exist")}</h1>
          <p className="mt-3 text-muted">
            {t(
              "Vielleicht wurde sie gelöscht, oder sie gehört zu einem anderen Konto.",
              "Maybe it was deleted, or it belongs to another account.",
            )}
          </p>
          <Link href={lp("/app")} className="btn mt-6">
            {t("Zu meinen Wohnungen", "Go to my flats")}
          </Link>
        </PaneBody>
      </>
    );
  }
  return <FlatCtx.Provider value={flat.data}>{children}</FlatCtx.Provider>;
}
