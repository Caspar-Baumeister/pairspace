"use client";

import { useRouter } from "next/navigation";

import { PricingCards } from "@/components/app/PricingCards";

/** On the public page the plan is chosen after the flat is set up, so the button leads to sign up. */
export function PublicPricing() {
  const router = useRouter();
  return <PricingCards onChoose={() => router.push("/anmelden?neu=1")} />;
}
