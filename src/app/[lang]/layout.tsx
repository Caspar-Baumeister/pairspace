import type { Metadata, Viewport } from "next";

// Fallback for systems without a good interface font, exactly like Obsidian.
// Self hosted so no request ever leaves the page to a font CDN.
import "@fontsource-variable/inter";
import "../globals.css";
import { Analytics } from "@/components/analytics/Analytics";
import { AuthProvider } from "@/lib/firebase/auth";
import { I18nProvider } from "@/lib/i18n/client";
import { LOCALES, toLocale, translator } from "@/lib/i18n";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  const title = t("Pairspace | Die passende WG für deine Zimmer", "Pairspace | The right flatmates for your rooms");
  return {
    metadataBase: new URL(site),
    title: { default: title, template: "%s | Pairspace" },
    description: t(
      "Für Vermieter möblierter WG Zimmer: Bewerber bewerten sich gegenseitig, Pairspace findet die Gruppe, die wirklich zusammenpasst.",
      "For landlords of furnished rooms in shared flats: applicants rate each other and Pairspace finds the group that really fits.",
    ),
    applicationName: "Pairspace",
    openGraph: {
      type: "website",
      url: site,
      siteName: "Pairspace",
      title,
      description: t(
        "Bewerber bewerten sich gegenseitig, du siehst als Graph, wer zusammenpasst.",
        "Applicants rate each other and a graph shows you who fits together.",
      ),
      locale: locale === "en" ? "en_GB" : "de_DE",
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const locale = toLocale((await params).lang);
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <AuthProvider>
            <Analytics />
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
