"use client";

import { useRouter } from "next/navigation";

import { PricingCards } from "@/components/app/PricingCards";
import { track } from "@/lib/analytics";
import { useLocalePath } from "@/lib/i18n/client";

/** On the public page the plan is chosen after the flat is set up, so the button leads to sign up. */
export function PublicPricing() {
  const router = useRouter();
  const lp = useLocalePath();
  return (
    <PricingCards
      onChoose={() => {
        track("cta_clicked", { location: "pricing" });
        router.push(lp("/anmelden?neu=1"));
      }}
    />
  );
}
