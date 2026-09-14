import { MascotDuo, MascotProud, MascotWave } from "@/components/mascot/Scenes";
import { Reveal } from "./Reveal";

const steps = [
  {
    n: 1,
    title: "Create your event",
    body: "Name it, pick the categories that matter (Base and Flyer, Leader and Follower, or your own), and add the questions participants should answer. Two minutes, no card.",
    scene: (
      <MascotWave className="w-full" label="Kai waves hello" />
    ),
    tint: "var(--color-accent-soft)",
  },
  {
    n: 2,
    title: "Share one link",
    body: "You get a single link and a QR code for this event. Drop it in your WhatsApp group, your confirmation mail, or on a poster at the door.",
    scene: (
      <div className="relative">
        <MascotProud className="w-full" label="Kai winks and holds up the event link" />
        <div className="speech speech-bottom absolute -top-2 left-1/2 w-max max-w-[220px] -translate-x-1/2 -translate-y-full text-[0.8125rem]">
          joinpairspace.com/e/acro-weekend
        </div>
      </div>
    ),
    tint: "var(--color-sun-soft)",
  },
  {
    n: 3,
    title: "Participants pair up",
    body: "People open the link in their browser, say what they are and what they are looking for, and see who fits. One request, one yes, and they have each other's contact.",
    scene: (
      <MascotDuo className="w-full" label="Kai and Mo hold paws" />
    ),
    tint: "var(--color-coral-soft)",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-[720px] text-center">
        <p className="eyebrow">How it works</p>
        <h2 className="display-l mt-3 text-balance">Set up the space. Let people find each other.</h2>
        <p className="body-l mx-auto mt-4 max-w-[46ch]">
          You provide the structure. Participants do the partnering themselves.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 flex w-full max-w-[960px] flex-col gap-6">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 70}>
            <article className="card overflow-hidden">
              <div className="grid items-center gap-6 p-6 sm:grid-cols-[1fr_200px] sm:gap-10 sm:p-8">
                <div className={i % 2 === 1 ? "sm:order-last" : ""}>
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[1.25rem] font-black text-ink"
                    style={{ background: s.tint, boxShadow: "0 3px 0 var(--color-line)" }}
                    aria-hidden="true"
                  >
                    {s.n}
                  </span>
                  <h3 className="heading mt-4">{s.title}</h3>
                  <p className="mt-2.5 text-[1rem] font-medium leading-relaxed text-ink-muted">{s.body}</p>
                </div>
                <div
                  className={`mx-auto w-full max-w-[220px] rounded-3xl p-4 pt-10 sm:max-w-none ${
                    i % 2 === 1 ? "sm:order-first" : ""
                  }`}
                  style={{ background: s.tint }}
                >
                  {s.scene}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
