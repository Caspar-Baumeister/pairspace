import Link from "next/link";

import { MascotDuo } from "@/components/mascot/Scenes";
import { Reveal } from "./Reveal";

export function ClosingCta() {
  return (
    <section className="px-5 pb-20 pt-6 sm:px-6 sm:pb-28">
      <Reveal>
        <div className="relative mx-auto w-full max-w-[960px] overflow-hidden rounded-[32px] bg-accent-soft px-6 pb-8 pt-10 text-center sm:px-12 sm:pt-14">
          <div className="mx-auto w-full max-w-[300px] sm:max-w-[360px]">
            <MascotDuo className="w-full" label="Kai and Mo holding paws" />
          </div>
          <p className="eyebrow mt-6">Come in pairs</p>
          <h2 className="display-l mx-auto mt-3 max-w-[18ch] text-balance">
            Your participants are already coming. Help them find each other.
          </h2>
          <p className="body-l mx-auto mt-4 max-w-[44ch]">
            Sea otters hold paws so they never drift apart. Your event deserves the same.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link href="/create" className="btn btn-primary">
              Create your event
            </Link>
          </div>
          <p className="mt-4 text-[0.875rem] font-bold text-ink-muted">
            Free. Sign in with Google or Apple at the end to keep your link.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
