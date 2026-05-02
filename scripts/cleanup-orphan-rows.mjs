// Delete all letters/voice_messages/recipients/orders/etc tied to the 3 refunded
// payment intents, and ensure all 3 webhook event ids are recorded so future
// retries short-circuit.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const PIs = [
  "pi_3TR7xvJ03BFqrZrA0jtM3X5i",  // $41
  "pi_3TRLb0J03BFqrZrA0q7P3UQ7",  // $36
  "pi_3TRLbYJ03BFqrZrA17272RxT",  // $36 dupe
];
const userId = "6101f3b6-57b2-4f5b-9bd2-36c10ee8af3d";
const eventIds = [
  "evt_1TR7xxJ03BFqrZrABBsuT77A",
  "evt_1TRLb2J03BFqrZrAKlIkJMo4",
  "evt_1TRLbaJ03BFqrZrAPP2ICMwC",
];

console.log("=== Snapshot BEFORE cleanup ===");
const before = await sb.from("letters").select("id, status, created_at, stripe_payment_intent_id").eq("user_id", userId).in("stripe_payment_intent_id", PIs);
console.log(`  letters tied to refunded PIs: ${before.data?.length ?? 0}`);
for (const l of before.data || []) console.log(`    ${l.id}  ${l.created_at}  ${l.status}  ${l.stripe_payment_intent_id}`);

const beforeV = await sb.from("voice_messages").select("id, status, created_at, message_format, stripe_payment_intent_id").eq("user_id", userId).in("stripe_payment_intent_id", PIs);
console.log(`  voice_messages tied to refunded PIs: ${beforeV.data?.length ?? 0}`);
for (const v of beforeV.data || []) console.log(`    ${v.id}  ${v.created_at}  ${v.status}  ${v.message_format}  ${v.stripe_payment_intent_id}`);

console.log("\n=== Step 1: Re-insert all 3 event ids (idempotent, blocks future retries) ===");
for (const evt of eventIds) {
  let success = false;
  for (let attempt = 1; attempt <= 5 && !success; attempt++) {
    const r = await sb.from("stripe_webhook_events")
      .upsert({ id: evt, type: "checkout.session.completed" }, { onConflict: "id", ignoreDuplicates: true })
      .select();
    if (r.error) {
      console.log(`  ${evt} attempt ${attempt}: ERR ${r.error.message ?? r.error} — retrying`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    } else {
      console.log(`  ${evt} attempt ${attempt}: OK (rows ${r.data?.length ?? 0})`);
      success = true;
    }
  }
  if (!success) console.log(`  ${evt}: PERMANENTLY FAILED — manual intervention needed`);
}

console.log("\n=== Step 2: Delete letters tied to refunded PIs ===");
const delLetters = await sb.from("letters").delete().eq("user_id", userId).in("stripe_payment_intent_id", PIs).select();
console.log(`  deleted: ${delLetters.error ? "ERR " + delLetters.error.message : delLetters.data?.length}`);

console.log("\n=== Step 3: Delete voice_messages tied to refunded PIs ===");
const delVoices = await sb.from("voice_messages").delete().eq("user_id", userId).in("stripe_payment_intent_id", PIs).select();
console.log(`  deleted: ${delVoices.error ? "ERR " + delVoices.error.message : delVoices.data?.length}`);

console.log("\n=== Step 4: Delete orders tied to refunded PIs (if any) ===");
const delOrders = await sb.from("orders").delete().eq("user_id", userId).in("stripe_payment_intent_id", PIs).select();
console.log(`  deleted: ${delOrders.error ? "ERR " + delOrders.error.message : delOrders.data?.length}`);

console.log("\n=== Step 5: Final state ===");
const lAfter = await sb.from("letters").select("id").eq("user_id", userId);
const vAfter = await sb.from("voice_messages").select("id, status").eq("user_id", userId);
const oAfter = await sb.from("orders").select("id").eq("user_id", userId);
console.log(`  letters total for user: ${lAfter.data?.length ?? 0}`);
console.log(`  voice_messages total for user: ${vAfter.data?.length ?? 0} (active=${vAfter.data?.filter(v => v.status !== "vault_allocated").length})`);
console.log(`  orders total for user: ${oAfter.data?.length ?? 0}`);

const eAfter = await sb.from("stripe_webhook_events").select("id, received_at").order("received_at", { ascending: false });
console.log(`\n  stripe_webhook_events: ${eAfter.data?.length ?? 0} rows`);
for (const e of eAfter.data || []) console.log(`    ${e.received_at}  ${e.id}`);

// Also verify refund status
console.log("\n=== Refund status sanity check ===");
for (const pi of PIs) {
  const refunds = await stripe.refunds.list({ payment_intent: pi, limit: 5 });
  for (const r of refunds.data) {
    console.log(`  ${pi}  refund ${r.id}  status=${r.status}  $${r.amount / 100}`);
  }
}
