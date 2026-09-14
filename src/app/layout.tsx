import type { Metadata, Viewport } from "next";

// Self hosted so no request ever leaves the page to a font CDN.
import "@fontsource-variable/nunito";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/auth";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Pairspace | Participant Matching for Events",
    template: "%s | Pairspace",
  },
  description:
    "Create an event, define participant categories such as Base, Flyer, Leader or Follower, and share one link. Participants partner up themselves. No app needed.",
  keywords: [
    "participant matching for events",
    "event participant matching",
    "partner matching for events",
    "find a partner at an event",
    "dance partner matching for workshops",
    "leader and follower matching",
    "acro partner finder for festivals",
    "workshop partner matching tool",
    "participant partnering",
    "event partner finder link",
  ],
  applicationName: "Pairspace",
  authors: [{ name: "Pairspace" }],
  creator: "Pairspace",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site,
    siteName: "Pairspace",
    title: "The easiest way to let participants partner up.",
    description:
      "Participant matching for events. One event link, no app download, no permanent participant profiles.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The easiest way to let participants partner up.",
    description:
      "Participant matching for events. One event link, no app download, no permanent participant profiles.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#faf5f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior tells Next 16 to suspend smooth scrolling during
    // route navigation, so a new page opens at the top instead of visibly
    // scrolling there.
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
