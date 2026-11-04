import { NextResponse } from "next/server";

import { landlordFromRequest } from "@/lib/firebase/admin";
import { toLocale } from "@/lib/i18n";
import { getBilling, portalConfiguration, stripe, stripeConfigured } from "@/lib/stripe";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Opens the Stripe customer portal: payment method, invoices, switching plans, cancelling. */
export async function POST(request: Request) {
  const caller = await landlordFromRequest(request);
  if (!caller) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: "payment-unavailable" }, { status: 402 });

  const { locale: raw } = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = toLocale(raw);
  const { customerId } = await getBilling(caller.uid);
  if (!customerId) return NextResponse.json({ error: "no-customer" }, { status: 404 });

  const portal = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${site}${locale === "en" ? "/en" : ""}/app/abo`,
    configuration: await portalConfiguration(),
    locale,
  });
  return NextResponse.json({ url: portal.url });
}
