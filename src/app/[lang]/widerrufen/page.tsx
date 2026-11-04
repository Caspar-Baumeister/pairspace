import type { Metadata } from "next";

import { ContractForm } from "@/components/site/ContractForm";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { alternates, toLocale, translator } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return {
    title: t("Vertrag widerrufen", "Withdraw from contract"),
    description: t(
      "Widerrufe dein Abo bei Pairspace innerhalb von 14 Tagen, ohne Anmeldung.",
      "Withdraw from your Pairspace subscription within 14 days, without signing in.",
    ),
    alternates: alternates(locale, "/widerrufen"),
  };
}

/** § 356a BGB: the online withdrawal function, linked from the footer and the Widerrufsbelehrung. */
export default function WithdrawPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="mx-auto max-w-[560px] px-4 pb-24 pt-12 md:px-6 md:pt-16">
        <ContractForm kind="withdraw" />
      </main>
      <SiteFooter />
    </div>
  );
}
