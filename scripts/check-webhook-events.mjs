// Check if Stripe webhook events for these sessions were received and recorded
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const PIs = [
  "pi_3TR7xvJ03BFqrZrA0jtM3X5i",
  "pi_3TRLb0J03BFqrZrA0q7P3UQ7",
  "pi_3TRLbYJ03BFqrZrA17272RxT",
];

console.log("=== Stripe events tied to these payment_intents ===");
for (const pi of PIs) {
  const events = await stripe.events.list({
    type: "checkout.session.completed",
    created: { gte: Math.floor((Date.now() - 1000 * 60 * 60 * 24) / 1000) },
    limit: 100,
  });
  const matching = events.data.filter(
    (e) => e.data.object?.payment_intent === pi
  );
  for (const e of matching) {
    console.log(`  pi ${pi}: event ${e.id}  ${new Date(e.created * 1000).toISOString()}  type=${e.type}`);
    // Check if recorded in our idempotency table
    const { data: rec } = await supabase
      .from("stripe_webhook_events")
      .select("id, type, created_at")
      .eq("id", e.id)
      .maybeSingle();
    console.log(`    → recorded in stripe_webhook_events: ${rec ? "YES at " + rec.created_at : "NO (webhook never reached us!)"}`);
  }
  if (matching.length === 0) {
    console.log(`  pi ${pi}: NO matching event found in last 24h on Stripe`);
  }
}

console.log("\n=== All webhook event delivery attempts (look for failures) ===");
// Stripe stores delivery attempts at /webhook_endpoints. Let's get the endpoint and its recent events.
const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
for (const ep of endpoints.data) {
  console.log(`\n  endpoint ${ep.id}  url=${ep.url}  status=${ep.status}`);
  console.log(`  enabled events: ${ep.enabled_events.slice(0, 5).join(", ")}${ep.enabled_events.length > 5 ? "..." : ""}`);
}

console.log("\nDone.");
