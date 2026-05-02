import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

console.log("=== Most recent stripe_webhook_events rows (last 20) ===");
const { data, error } = await supabase
  .from("stripe_webhook_events")
  .select("id, type, created_at")
  .order("created_at", { ascending: false })
  .limit(20);
if (error) console.error(error);
for (const r of data || []) console.log(`  ${r.created_at}  ${r.type}  ${r.id}`);

console.log("\n=== Stripe events from last 7 days that should have hit us ===");
const since = Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 7) / 1000);
const events = await stripe.events.list({ created: { gte: since }, limit: 100 });
const ccs = events.data.filter(e => e.type === "checkout.session.completed");
console.log(`  ${ccs.length} checkout.session.completed events in last 7d`);
console.log(`  ${events.data.length} total events fetched`);

// Sample first 10 with pending_webhooks
for (const e of ccs.slice(0, 10)) {
  const { data: rec } = await supabase.from("stripe_webhook_events").select("id").eq("id", e.id).maybeSingle();
  console.log(`  ${new Date(e.created * 1000).toISOString()}  ${e.id}  pending_webhooks=${e.pending_webhooks}  recorded=${!!rec}`);
}
