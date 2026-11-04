import type { Metadata } from "next";

import { ContractForm } from "@/components/site/ContractForm";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { alternates, toLocale, translator } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return {
    title: t("Verträge hier kündigen", "Cancel contracts here"),
    description: t("Kündige dein Abo bei Pairspace, ohne Anmeldung.", "Cancel your Pairspace subscription, without signing in."),
    alternates: alternates(locale, "/kuendigen"),
  };
}

/** § 312k BGB: the confirmation page behind the cancel button in the footer. */
export default function CancelPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main className="mx-auto max-w-[560px] px-4 pb-24 pt-12 md:px-6 md:pt-16">
        <ContractForm kind="cancel" />
      </main>
      <SiteFooter />
    </div>
  );
}
