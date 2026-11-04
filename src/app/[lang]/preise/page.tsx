import type { Metadata } from "next";

import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { alternates, toLocale, translator } from "@/lib/i18n";
import { BASIC, euro } from "@/lib/plans";

import { PublicPricing } from "./PublicPricing";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  const month = euro(BASIC.monthly, locale);
  const year = euro(BASIC.yearly, locale);
  const days = BASIC.trialDays;
  return {
    title: t("Preise", "Pricing"),
    description: t(
      `${month} im Monat oder ${year} im Jahr, unbegrenzte Wohnungen. ${days} Tage kostenlos testen.`,
      `${month} per month or ${year} per year, unlimited flats. Try free for ${days} days.`,
    ),
    alternates: alternates(locale, "/preise"),
  };
}

export default async function PricingPage({ params }: Props) {
  const t = translator(toLocale((await params).lang));
  const days = BASIC.trialDays;
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="mx-auto max-w-[760px] px-4 pb-20 pt-14 md:px-6">
        <h1 className="h1 text-center md:text-[40px]">{t("Ein Tarif, alles drin", "One plan, everything included")}</h1>
        <p className="mx-auto mt-3 max-w-[480px] text-center text-muted">
          {t(
            `Teste ${days} Tage kostenlos. Danach monatlich oder jährlich, jederzeit kündbar.`,
            `Try free for ${days} days. Then monthly or yearly, cancel anytime.`,
          )}
        </p>
        <div className="mt-10">
          <PublicPricing />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
