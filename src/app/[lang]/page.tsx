import type { Metadata } from "next";

import { TrackedLink } from "@/components/analytics/TrackedLink";
import { HeroWindow } from "@/components/landing/HeroWindow";
import { PhoneDemo } from "@/components/landing/PhoneDemo";
import { PromoVideo } from "@/components/landing/PromoVideo";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { LogoMark } from "@/components/ui/Logo";
import { alternates, localePath, toLocale, translator } from "@/lib/i18n";
import { BASIC, euro } from "@/lib/plans";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  return { alternates: alternates(locale, "/") };
}

/** Short on purpose: hero, video, the applicant side, the promise. Built after obsidian.md. */
export default async function LandingPage({ params }: Props) {
  const locale = toLocale((await params).lang);
  const t = translator(locale);
  const lp = (path: string) => localePath(locale, path);

  const promises = [
    {
      title: t("Weniger Besichtigungen.", "Fewer viewings."),
      text: t(
        "Du lernst nur noch die Gruppe kennen, die zusammenpasst, statt dreißig Einzeltermine zu machen.",
        "You only meet the group that fits together instead of thirty separate viewings.",
      ),
    },
    {
      title: t("Mitbewohner, die bleiben.", "Flatmates who stay."),
      text: t(
        "Wer sich gegenseitig ausgesucht hat, zieht als WG ein und nicht als Zufallsgruppe.",
        "People who picked each other move in as a real flatshare, not as a random group.",
      ),
    },
    {
      title: t("Diskret für alle.", "Discreet for everyone."),
      text: t(
        "Bewertungen und Kontaktdaten sieht nur der Vermieter. Bewerber sehen nur die Profile ihrer Mitbewerber.",
        "Only the landlord sees ratings and contact details. Applicants only see the profiles of the others.",
      ),
    },
  ];

  const trial = t(`${BASIC.trialDays} Tage kostenlos testen`, `Try free for ${BASIC.trialDays} days`);

  return (
    <div className="min-h-dvh overflow-x-clip">
      <SiteNav />
      <main>
        <section className="mx-auto max-w-[1200px] px-4 pt-14 md:px-6 md:pt-24">
          <h1 className="rise-in max-w-[920px] text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[62px] lg:text-[80px]">
            {t("Vermiete an Leute, die zusammenpassen.", "Rent to people who fit together.")}
          </h1>
          <p
            className="rise-in mt-6 max-w-[780px] text-[22px] leading-[1.22] tracking-[-0.015em] text-muted sm:text-[30px] lg:text-[36px]"
            style={{ animationDelay: "120ms" }}
          >
            {t(
              "Pairspace findet aus allen Bewerbern die beste WG für deine Zimmer.",
              "Pairspace finds the best flatshare for your rooms among all your applicants.",
            )}
          </p>
          <div className="rise-in mt-9 flex flex-wrap items-center gap-x-7 gap-y-3" style={{ animationDelay: "220ms" }}>
            <TrackedLink
              href={lp("/anmelden?neu=1")}
              event="cta_clicked"
              properties={{ location: "hero" }}
              className="btn btn-cta h-14 rounded-xl px-7 text-[18px] font-semibold"
            >
              {trial}
            </TrackedLink>
            <a href="#video" className="text-[18px] font-medium text-accent hover:text-accent-hover">
              {t("Video ansehen", "Watch the video")}
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
            {t("In 30 Sekunden erklärt.", "Explained in 30 seconds.")}
          </h2>
          <div className="mt-8 md:mt-10">
            <PromoVideo />
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 pt-28 md:grid-cols-2 md:px-6 md:pt-40">
          <div>
            <h2 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[52px]">
              {t("Ein Link für alle Bewerber.", "One link for all applicants.")}
            </h2>
            <p className="mt-6 max-w-[500px] text-[18px] leading-[1.55] text-muted md:text-[21px]">
              {t(
                "Teil ihn in deiner Anzeige oder als Antwort auf jede Anfrage. Bewerber brauchen keine App: Sie bewerten ihre Mitbewerber von Auf keinen Fall bis Unbedingt und sortieren die Zimmer. In zwei Minuten erledigt.",
                "Put it in your listing or send it as a reply to every request. Applicants need no app: they rate each other from No way to Absolutely and rank the rooms. Done in two minutes.",
              )}
            </p>
          </div>
          <div className="flex min-w-0 justify-center">
            <PhoneDemo />
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 py-28 md:grid-cols-[1.1fr_1fr] md:px-6 md:py-40">
          <div className="space-y-9">
            {promises.map((p) => (
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
            <div className="mt-8 text-[22px] font-semibold text-ink">{t("Unbegrenzte Wohnungen.", "Unlimited flats.")}</div>
            <div className="mt-1 text-[18px] text-muted">
              {t(
                `${euro(BASIC.monthly, locale)} im Monat oder ${euro(BASIC.yearly, locale)} im Jahr`,
                `${euro(BASIC.monthly, locale)} per month or ${euro(BASIC.yearly, locale)} per year`,
              )}
            </div>
            <TrackedLink
              href={lp("/anmelden?neu=1")}
              event="cta_clicked"
              properties={{ location: "plan" }}
              className="mt-4 text-[18px] font-medium text-accent hover:text-accent-hover"
            >
              {trial}
            </TrackedLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
