import Link from "next/link";

import { NotificationStack } from "./NotificationStack";
import { OrbitField } from "./OrbitField";

export function Hero() {
  return (
    <section className="relative px-6 pb-8 pt-20 sm:pt-28">
      <OrbitField>
        <div className="relative mx-auto w-full max-w-[820px] text-center">
          <p className="eyebrow rise">Participant Matching for Events</p>

          <h1
            className="display-xl rise mt-5 text-balance"
            style={{ animationDelay: "60ms" }}
          >
            The easiest way to let participants partner up.
          </h1>

          <p
            className="body-l rise mx-auto mt-6 max-w-[54ch] text-pretty"
            style={{ animationDelay: "140ms" }}
          >
            Create an event, define your participant categories, and share one link. People can
            introduce themselves, or simply get notified when the right partner joins.
          </p>

          <div
            className="rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "220ms" }}
          >
            <Link href="/create" className="btn btn-primary w-full sm:w-auto">
              Create your event
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary w-full sm:w-auto">
              See how it works
            </Link>
          </div>

          <p
            className="rise mt-5 text-[0.875rem] text-ink-faint"
            style={{ animationDelay: "300ms" }}
          >
            One event link. No app download. No permanent participant profiles.
          </p>

          <NotificationStack />
        </div>
      </OrbitField>
    </section>
  );
}
