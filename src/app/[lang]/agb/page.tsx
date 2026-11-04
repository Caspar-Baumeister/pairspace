import { agbDoc } from "@shared/agb";
import type { Metadata } from "next";

import { docSections, LegalPage } from "@/components/site/LegalPage";
import { alternates, toLocale, translator } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return {
    title: t("AGB und Nutzungsbedingungen", "Terms and conditions"),
    description: t(
      "Die Regeln für Vermieter mit Abo und für Bewerber, die Pairspace kostenlos nutzen.",
      "The rules for landlords with a subscription and for applicants who use Pairspace for free.",
    ),
    alternates: alternates(locale, "/agb"),
  };
}

/** The text lives in functions/src/shared/agb.ts, the contract confirmation mail sends the same. */
export default async function TermsPage({ params }: Props) {
  const locale = toLocale((await params).lang);
  const doc = agbDoc(locale);
  return (
    <LegalPage
      locale={locale}
      title={doc.title}
      lead={doc.lead ? <p>{doc.lead}</p> : undefined}
      numbered={doc.numbered}
      sections={docSections(doc, locale)}
    />
  );
}
