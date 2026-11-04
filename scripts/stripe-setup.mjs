#!/usr/bin/env node
/**
 * Sets up Stripe for Pairspace in one go, safe to run again:
 *   1. product "Pairspace Basic" with 9,99 € a month and 100 € a year
 *      (lookup keys pairspace_basic_monthly / pairspace_basic_yearly)
 *   2. customer portal: payment method, invoices, switching, cancelling
 *   3. webhook https://joinpairspace.com/api/stripe/webhook (live keys only)
 *   4. secrets STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in App Hosting
 *
 *   node scripts/stripe-setup.mjs
 *
 * The secret key is asked for without echo and goes straight to Secret
 * Manager, it is never written to a file. apphosting.yaml already references
 * both secrets, so a push rolls them out.
 */
import { spawnSync } from "node:child_process";
import readline from "node:readline";
import { Writable } from "node:stream";

import Stripe from "stripe";

const PROJECT = "pairspace-live";
const SITE = "https://joinpairspace.com";
const APP = "pairspace";
const PRICES = [
  { lookup: "pairspace_basic_monthly", amount: 999, interval: "month", nickname: "Basic monthly" },
  { lookup: "pairspace_basic_yearly", amount: 10000, interval: "year", nickname: "Basic yearly" },
];
const EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
];

function ask(question, hidden = false) {
  // Overriding rl._writeToOutput no longer hides input on Node 24, so a hidden
  // answer goes through an output stream that drops everything after the prompt.
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, done) {
      if (!muted) process.stdout.write(chunk, encoding);
      done();
    },
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  process.stdout.write(question);
  muted = hidden;
  return new Promise((resolve) => rl.question("", (a) => (rl.close(), hidden && process.stdout.write("\n"), resolve(a.trim()))));
}

function setSecret(name, value) {
  const run = spawnSync("firebase", ["apphosting:secrets:set", name, "--project", PROJECT, "--data-file", "-", "--force"], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (run.status !== 0) throw new Error(`firebase apphosting:secrets:set ${name} failed`);
}

const key = process.env.STRIPE_SECRET_KEY || (await ask("Stripe Secret Key (sk_live_...): ", true));
if (!/^(sk|rk)_(live|test)_/.test(key)) throw new Error("That does not look like a Stripe secret key.");
const live = key.includes("_live_");
const stripe = new Stripe(key);

const account = await stripe.accounts.retrieveCurrent();
console.log(`Stripe account ${account.settings?.dashboard?.display_name ?? account.id}, ${live ? "LIVE" : "test"} mode`);
// Sharing the Immotrim account is fine (Caspar, 04.11.2026): Pairspace has its
// own product, portal configuration and webhook, and ignores Immotrim's events.

// 1. Product and prices
const products = await stripe.products.list({ limit: 100, active: true });
let product = products.data.find((p) => p.metadata?.app === APP);
// The account may be shared (Immotrim), so card statements name Pairspace.
const STATEMENT = "PAIRSPACE";
if (product && product.statement_descriptor !== STATEMENT) {
  product = await stripe.products.update(product.id, { statement_descriptor: STATEMENT });
}
product ??= await stripe.products.create({
  statement_descriptor: STATEMENT,
  name: "Pairspace Basic",
  description: "Unbegrenzte Wohnungen, Matching Graph und beste Gruppen.",
  metadata: { app: APP },
});
console.log(`product ${product.id}`);

const priceIds = {};
for (const p of PRICES) {
  const { data } = await stripe.prices.list({ lookup_keys: [p.lookup], active: true, limit: 1 });
  const price =
    data[0] ??
    (await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: p.amount,
      recurring: { interval: p.interval },
      lookup_key: p.lookup,
      nickname: p.nickname,
      tax_behavior: "inclusive",
    }));
  priceIds[p.interval] = price.id;
  console.log(`price ${p.lookup} ${price.id}`);
}

// 2. Customer portal
const portal = {
  business_profile: {
    headline: "Pairspace: Abo, Zahlungsart und Rechnungen",
    privacy_policy_url: `${SITE}/datenschutz`,
    terms_of_service_url: `${SITE}/agb`,
  },
  default_return_url: `${SITE}/app/abo`,
  features: {
    customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      cancellation_reason: {
        enabled: true,
        options: ["too_expensive", "unused", "missing_features", "switched_service", "other"],
      },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "create_prorations",
      products: [{ product: product.id, prices: [priceIds.month, priceIds.year] }],
    },
  },
  metadata: { app: APP },
};
const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
const existingPortal = configs.data.find((c) => c.metadata?.app === APP);
const { metadata: _m, ...portalUpdate } = portal;
const portalConfig = existingPortal
  ? await stripe.billingPortal.configurations.update(existingPortal.id, portalUpdate)
  : await stripe.billingPortal.configurations.create(portal);
console.log(`portal ${portalConfig.id}`);

// 3. Webhook and 4. secrets, only for the live site
if (!live) {
  console.log(`
Test mode: no webhook and no App Hosting secrets. For local testing put
STRIPE_SECRET_KEY into .env.local and run
  stripe listen --forward-to localhost:3000/api/stripe/webhook
and put the whsec_ it prints into STRIPE_WEBHOOK_SECRET in .env.local.`);
  process.exit(0);
}

const url = `${SITE}/api/stripe/webhook`;
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
let endpoint = endpoints.data.find((e) => e.url === url);
let webhookSecret = null;
if (endpoint) {
  await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: EVENTS });
  const again = await ask("Webhook exists already, its secret cannot be read back. Recreate it? (y/N) ");
  if (again.toLowerCase() === "y") {
    await stripe.webhookEndpoints.del(endpoint.id);
    endpoint = null;
  }
}
if (!endpoint) {
  endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTS, description: "Pairspace subscriptions" });
  webhookSecret = endpoint.secret;
}
console.log(`webhook ${endpoint.id}`);

setSecret("STRIPE_SECRET_KEY", key);
if (webhookSecret) setSecret("STRIPE_WEBHOOK_SECRET", webhookSecret);

console.log(`
Done. Next:
  1. apphosting.yaml lists both secrets already, push to roll them out
  2. Stripe Dashboard, Settings, Emails: turn on receipts and invoice mails`);
