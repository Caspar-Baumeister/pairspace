import { widerrufDoc } from "@shared/widerruf";
import type { Metadata } from "next";

import { docSections, LegalPage } from "@/components/site/LegalPage";
import { alternates, toLocale, translator } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return {
    title: t("Widerrufsbelehrung", "Right of withdrawal"),
    description: t(
      "Dein Widerrufsrecht für das Abo bei Pairspace, mit Muster-Widerrufsformular.",
      "Your right to withdraw from a Pairspace subscription, with the model withdrawal form.",
    ),
    alternates: alternates(locale, "/widerruf"),
  };
}

/** The text lives in functions/src/shared/widerruf.ts, the contract confirmation mail sends the same. */
export default async function WithdrawalPage({ params }: Props) {
  const locale = toLocale((await params).lang);
  const doc = widerrufDoc(locale);
  return (
    <LegalPage
      locale={locale}
      title={doc.title}
      lead={doc.lead ? <p>{doc.lead}</p> : undefined}
      numbered={doc.numbered}
      toc={false}
      sections={docSections(doc, locale)}
    />
  );
}
