import type { Metadata } from "next";

import { Boundaries } from "@/components/landing/Boundaries";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { Faq } from "@/components/landing/Faq";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Matching } from "@/components/landing/Matching";
import { ProductTour } from "@/components/landing/ProductTour";
import { ProofBand } from "@/components/landing/ProofBand";
import { UseCases } from "@/components/landing/UseCases";
import { Footer } from "@/components/site/Footer";
import { FAQ_ITEMS } from "@/lib/faq";
import { Nav } from "@/components/site/Nav";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Pairspace | Participant Matching for Events",
  description:
    "Participant matching for events. Create an event, define categories such as Base, Flyer, Leader or Follower, share one link, and let participants partner up themselves.",
  alternates: { canonical: "/" },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pairspace",
  alternateName: "Participant Matching for Events",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any browser",
  url: site,
  description:
    "Pairspace is participant matching for events. Organizers create an event, define participant categories, and share one link so participants can partner up themselves.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  featureList: [
    "Custom participant categories such as Base, Flyer, Leader and Follower",
    "One shareable event link with no app download",
    "Temporary event profiles instead of permanent accounts",
    "Email notification when a matching participant joins",
    "Organizer dashboard with live participant statistics",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to let participants find a partner at your event",
  step: [
    {
      "@type": "HowToStep",
      name: "Create your event and participant categories",
      text: "Define the categories that matter at your event, such as Base and Flyer or Leader and Follower, and the questions participants should answer.",
    },
    {
      "@type": "HowToStep",
      name: "Share one simple link",
      text: "Send the event link through WhatsApp, email or your event website.",
    },
    {
      "@type": "HowToStep",
      name: "Let participants join or activate notifications",
      text: "Participants create a temporary event profile and browse matching people, or leave an email address and get notified when a suitable partner joins.",
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <Nav />
      <main id="main">
        <Hero />
        <ProofBand />
        <HowItWorks />
        <Matching />
        <ProductTour />
        <UseCases />
        <Boundaries />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
