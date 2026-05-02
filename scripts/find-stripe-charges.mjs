// Find recent Stripe charges/payment_intents tied to simaan23@gmail.com
import Stripe from "stripe";
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
const EMAIL = "simaan23@gmail.com";

// Look at last 24h of checkout sessions
const since = Math.floor((Date.now() - 1000 * 60 * 60 * 24) / 1000);

console.log(`\n=== Checkout sessions since ${new Date(since * 1000).toISOString()} matching ${EMAIL} ===`);
const sessions = await stripe.checkout.sessions.list({
  created: { gte: since },
  limit: 100,
});

const matches = sessions.data.filter(
  (s) => (s.customer_email || s.customer_details?.email || "").toLowerCase() === EMAIL.toLowerCase()
);
console.log(`found ${matches.length} session(s)`);

for (const s of matches) {
  console.log(`\n  session ${s.id}`);
  console.log(`    created     ${new Date(s.created * 1000).toISOString()}`);
  console.log(`    status      ${s.status}  payment_status=${s.payment_status}`);
  console.log(`    amount      $${(s.amount_total ?? 0) / 100}`);
  console.log(`    pi          ${s.payment_intent}`);
  console.log(`    metadata    ${JSON.stringify(s.metadata)}`);
}

// Also list payment_intents directly to be thorough
console.log(`\n=== Recent successful PaymentIntents (last 24h) ===`);
const pis = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100 });
const piMatches = pis.data.filter((p) =>
  (p.receipt_email || "").toLowerCase() === EMAIL.toLowerCase() ||
  (p.metadata?.email || "").toLowerCase() === EMAIL.toLowerCase()
);
console.log(`found ${piMatches.length} pi(s) by email match`);
for (const p of piMatches) {
  console.log(`  ${p.id}  ${new Date(p.created * 1000).toISOString()}  status=${p.status}  $${p.amount / 100}  receipt=${p.receipt_email}`);
  console.log(`    metadata keys: ${Object.keys(p.metadata || {}).join(", ")}`);
}

console.log("\nDone.");
