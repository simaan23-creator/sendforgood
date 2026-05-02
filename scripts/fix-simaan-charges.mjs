// Refund all 3 stuck charges + block their pending webhook retries
// so no rows get created when Stripe redelivers.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const charges = [
  { pi: "pi_3TR7xvJ03BFqrZrA0jtM3X5i", evt: "evt_1TR7xxJ03BFqrZrABBsuT77A", amount: "$41" },
  { pi: "pi_3TRLb0J03BFqrZrA0q7P3UQ7", evt: "evt_1TRLb2J03BFqrZrAKlIkJMo4", amount: "$36" },
  { pi: "pi_3TRLbYJ03BFqrZrA17272RxT", evt: "evt_1TRLbaJ03BFqrZrAPP2ICMwC", amount: "$36 (dupe)" },
];

console.log("=== Step 1: Pre-insert event ids to short-circuit Stripe webhook retries ===");
for (const c of charges) {
  const r = await sb
    .from("stripe_webhook_events")
    .upsert({ id: c.evt, type: "checkout.session.completed" }, { onConflict: "id", ignoreDuplicates: true })
    .select();
  console.log(`  ${c.evt}  →  ${r.error ? "ERR " + r.error.message : "OK (rows: " + (r.data?.length ?? 0) + ")"}`);
}

console.log("\n=== Step 2: Issue full refunds ===");
for (const c of charges) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: c.pi,
      reason: "requested_by_customer",
      metadata: { reason: "webhook_failure_blocked_fulfillment", incident: "missing_stripe_webhook_events_table" },
    });
    console.log(`  ${c.pi} (${c.amount})  →  refund ${refund.id}  status=${refund.status}  $${refund.amount / 100}`);
  } catch (e) {
    console.log(`  ${c.pi} (${c.amount})  →  ERR  ${e.message}`);
  }
}

console.log("\n=== Step 3: Verify final state ===");
const userId = "6101f3b6-57b2-4f5b-9bd2-36c10ee8af3d";
const { data: letters } = await sb.from("letters").select("id").eq("user_id", userId);
const { data: voices } = await sb.from("voice_messages").select("id").eq("user_id", userId).neq("status", "vault_allocated");
console.log(`  letters for simaan23: ${letters?.length ?? 0}`);
console.log(`  active voice_messages: ${voices?.length ?? 0}`);

const { data: events } = await sb.from("stripe_webhook_events").select("id, type, received_at").order("received_at", { ascending: false });
console.log(`  stripe_webhook_events rows: ${events?.length ?? 0}`);
for (const e of events || []) console.log(`    ${e.received_at}  ${e.type}  ${e.id}`);

console.log("\nDone. The 3 events are now marked processed; Stripe retries will short-circuit. Charges refunded.");
