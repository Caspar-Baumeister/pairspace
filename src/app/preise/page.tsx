import type { Metadata } from "next";

import { SiteFooter, SiteNav } from "@/components/site/SiteNav";

import { PublicPricing } from "./PublicPricing";

export const metadata: Metadata = {
  title: "Preise",
  description: "Basic: 9,99 € im Monat oder 100 € im Jahr. 7 Tage kostenlos testen.",
};

export default function PricingPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="mx-auto max-w-[760px] px-4 pb-20 pt-14 md:px-6">
        <h1 className="h1 text-center md:text-[40px]">Ein Tarif, alles drin</h1>
        <p className="mx-auto mt-3 max-w-[480px] text-center text-muted">
          Teste 7 Tage kostenlos. Danach monatlich oder jährlich, jederzeit kündbar.
        </p>
        <div className="mt-10">
          <PublicPricing />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
