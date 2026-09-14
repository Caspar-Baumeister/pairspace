import Link from "next/link";

import { MascotLift } from "@/components/mascot/Scenes";

export function Hero() {
  return (
    <section className="relative overflow-x-clip px-5 pb-10 pt-8 sm:px-6 sm:pt-16">
      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Mascot first on mobile, right column on desktop. */}
        <div className="relative order-first mx-auto w-full max-w-[300px] lg:order-last lg:max-w-[440px]">
          <div
            aria-hidden="true"
            className="pop absolute left-1/2 top-1/2 -z-10 aspect-square w-[118%] -translate-x-1/2 -translate-y-[46%] rounded-full bg-accent-soft"
          />
          <div className="rise" style={{ animationDelay: "80ms" }}>
            <MascotLift
              className="w-full"
              label="Kai the otter lifts Mo the otter overhead, the way a base holds a flyer"
            />
          </div>
        </div>

        <div className="text-center lg:text-left">
          <p className="eyebrow rise">Participant Matching for Events</p>

          <h1 className="display-xl rise mt-4 text-balance" style={{ animationDelay: "60ms" }}>
            The easiest way to let participants <span className="marker">partner&nbsp;up.</span>
          </h1>

          <p
            className="body-l rise mx-auto mt-5 max-w-[46ch] text-pretty lg:mx-0"
            style={{ animationDelay: "140ms" }}
          >
            Create an event, define your categories, share one link. Participants introduce
            themselves and find each other. You just watch it happen.
          </p>

          <div
            className="rise mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
            style={{ animationDelay: "220ms" }}
          >
            <Link href="/create" className="btn btn-primary">
              Create your event
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary">
              See how it works
            </Link>
          </div>

          <p
            className="rise mt-5 text-[0.9375rem] font-bold text-ink-faint"
            style={{ animationDelay: "300ms" }}
          >
            One link. No app download. No permanent profiles. Free.
          </p>
        </div>
      </div>
    </section>
  );
}
