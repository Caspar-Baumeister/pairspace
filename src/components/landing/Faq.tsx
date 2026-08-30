"use client";

import { useState } from "react";

import { FAQ_ITEMS } from "@/lib/faq";
import { Reveal } from "./Reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-surface px-6 py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-[1100px] gap-14 lg:grid-cols-[0.75fr_1.25fr]">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="display-l mt-4 max-w-[12ch] text-balance">Asked by organizers.</h2>
        </Reveal>

        <Reveal delay={60}>
          <div className="divide-y divide-line border-y border-line">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-6 py-5 text-left"
                  >
                    <span className="flex-1 text-[1.0625rem] font-medium tracking-[-0.015em] text-ink">
                      {item.q}
                    </span>
                    <span
                      className="mt-1 shrink-0 transition-transform duration-300"
                      style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 2v12M2 8h12"
                          stroke="var(--color-ink-faint)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      transitionTimingFunction: "var(--ease-out-quint)",
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[62ch] pb-6 pr-10 text-[0.9375rem] leading-relaxed text-ink-muted">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
