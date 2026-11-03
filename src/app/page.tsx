import Link from "next/link";

import { HeroWindow } from "@/components/landing/HeroWindow";
import { PhoneDemo } from "@/components/landing/PhoneDemo";
import { PromoVideo } from "@/components/landing/PromoVideo";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { LogoMark } from "@/components/ui/Logo";
import { BASIC, euro } from "@/lib/plans";

const PROMISES = [
  {
    title: "Weniger Besichtigungen.",
    text: "Du lernst nur noch die Gruppe kennen, die zusammenpasst, statt dreißig Einzeltermine zu machen.",
  },
  {
    title: "Mitbewohner, die bleiben.",
    text: "Wer sich gegenseitig ausgesucht hat, zieht als WG ein und nicht als Zufallsgruppe.",
  },
  {
    title: "Diskret für alle.",
    text: "Bewertungen und Kontaktdaten sieht nur der Vermieter. Bewerber sehen nur die Profile ihrer Mitbewerber.",
  },
];

/** Short on purpose: hero, video, the applicant side, the promise. Built after obsidian.md. */
export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <SiteNav />
      <main>
        <section className="mx-auto max-w-[1200px] px-4 pt-14 md:px-6 md:pt-24">
          <h1 className="rise-in max-w-[920px] text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[62px] lg:text-[80px]">
            Vermiete an Leute, die zusammenpassen.
          </h1>
          <p
            className="rise-in mt-6 max-w-[780px] text-[22px] leading-[1.22] tracking-[-0.015em] text-muted sm:text-[30px] lg:text-[36px]"
            style={{ animationDelay: "120ms" }}
          >
            Pairspace findet aus allen Bewerbern die beste WG für deine Zimmer.
          </p>
          <div className="rise-in mt-9 flex flex-wrap items-center gap-x-7 gap-y-3" style={{ animationDelay: "220ms" }}>
            <Link href="/anmelden?neu=1" className="btn btn-cta h-14 rounded-xl px-7 text-[18px] font-semibold">
              {BASIC.trialDays} Tage kostenlos testen
            </Link>
            <a href="#video" className="text-[18px] font-medium text-accent hover:text-accent-hover">
              Video ansehen
            </a>
          </div>

          <div className="rise-in relative mt-14 md:mt-20" style={{ animationDelay: "380ms" }}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-24 -top-28 bottom-1/3 bg-[radial-gradient(ellipse_at_50%_40%,hsl(254_80%_68%/0.16),transparent_62%)]"
            />
            <div className="relative">
              <HeroWindow />
            </div>
          </div>
        </section>

        <section id="video" className="mx-auto max-w-[1000px] scroll-mt-20 px-4 pt-28 md:px-6 md:pt-40">
          <h2 className="text-center text-[34px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[52px]">
            In 30 Sekunden erklärt.
          </h2>
          <div className="mt-8 md:mt-10">
            <PromoVideo />
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 pt-28 md:grid-cols-2 md:px-6 md:pt-40">
          <div>
            <h2 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[52px]">
              Ein Link für alle Bewerber.
            </h2>
            <p className="mt-6 max-w-[500px] text-[18px] leading-[1.55] text-muted md:text-[21px]">
              Teil ihn in deiner Anzeige oder als Antwort auf jede Anfrage. Bewerber brauchen keine App: Sie bewerten ihre
              Mitbewerber von Auf keinen Fall bis Unbedingt und sortieren die Zimmer. In zwei Minuten erledigt.
            </p>
          </div>
          <div className="flex min-w-0 justify-center">
            <PhoneDemo />
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 py-28 md:grid-cols-[1.1fr_1fr] md:px-6 md:py-40">
          <div className="space-y-9">
            {PROMISES.map((p) => (
              <p key={p.title} className="max-w-[540px] text-[20px] leading-[1.45] text-muted md:text-[24px]">
                <span className="block font-semibold text-ink">{p.title}</span>
                {p.text}
              </p>
            ))}
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-line bg-bg-2 px-6 py-14 text-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-[32px] border border-line-strong bg-bg text-ink shadow-[0_24px_70px_rgba(138,108,239,0.18)]">
              <LogoMark size={84} />
            </div>
            <div className="mt-7 text-[38px] font-bold tracking-[-0.03em] text-ink">Pairspace</div>
            <div className="mt-8 text-[22px] font-semibold text-ink">Unbegrenzte Wohnungen.</div>
            <div className="mt-1 text-[18px] text-muted">
              {euro(BASIC.monthly)} im Monat oder {euro(BASIC.yearly)} im Jahr
            </div>
            <Link href="/anmelden?neu=1" className="mt-4 text-[18px] font-medium text-accent hover:text-accent-hover">
              {BASIC.trialDays} Tage kostenlos testen
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
