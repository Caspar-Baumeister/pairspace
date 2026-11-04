import type { Metadata } from "next";

import { LegalPage, MailLink, OperatorAddress } from "@/components/site/LegalPage";
import { alternates, toLocale, translator } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return {
    title: t("Impressum", "Legal notice"),
    description: t("Wer Pairspace betreibt und wie du uns erreichst.", "Who runs Pairspace and how to reach us."),
    alternates: alternates(locale, "/impressum"),
  };
}

export default async function ImpressumPage({ params }: Props) {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  return (
    <LegalPage
      locale={locale}
      title={t("Impressum", "Legal notice")}
      numbered={false}
      toc={false}
      sections={[
        {
          id: "anbieter",
          title: t("Angaben gemäß § 5 DDG", "Information under § 5 DDG (German Digital Services Act)"),
          body: (
            <>
              <OperatorAddress locale={locale} />
              <p>{t("Pairspace ist ein Angebot von Caspar Baumeister.", "Pairspace is run by Caspar Baumeister.")}</p>
            </>
          ),
        },
        {
          id: "kontakt",
          title: t("Kontakt", "Contact"),
          body: (
            <p>
              {t("Mail", "Email")}: <MailLink />
            </p>
          ),
        },
        {
          id: "streitbeilegung",
          title: t("Verbraucherstreitbeilegung", "Consumer dispute resolution"),
          body: (
            <p>
              {t(
                "Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
                "We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.",
              )}
            </p>
          ),
        },
        {
          id: "bilder",
          title: t("Bildnachweis", "Image credits"),
          body: (
            <p>
              {t(
                "Die Porträts in den Beispielen auf der Startseite stammen von Unsplash.",
                "The portraits in the examples on the homepage are from Unsplash.",
              )}
            </p>
          ),
        },
      ]}
    />
  );
}
