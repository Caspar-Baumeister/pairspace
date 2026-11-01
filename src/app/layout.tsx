import type { Metadata, Viewport } from "next";

// Fallback for systems without a good interface font, exactly like Obsidian.
// Self hosted so no request ever leaves the page to a font CDN.
import "@fontsource-variable/inter";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/auth";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Pairspace | Die passende WG für deine Zimmer",
    template: "%s | Pairspace",
  },
  description:
    "Für Vermieter möblierter WG Zimmer: Bewerber bewerten sich gegenseitig, Pairspace findet die Gruppe, die wirklich zusammenpasst.",
  applicationName: "Pairspace",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site,
    siteName: "Pairspace",
    title: "Pairspace | Die passende WG für deine Zimmer",
    description: "Bewerber bewerten sich gegenseitig, du siehst als Graph, wer zusammenpasst.",
    locale: "de_DE",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
