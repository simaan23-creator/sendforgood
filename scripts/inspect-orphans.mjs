import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const userId = "6101f3b6-57b2-4f5b-9bd2-36c10ee8af3d";
const { data: letters } = await sb.from("letters").select("id, status, created_at, stripe_payment_intent_id, amount_paid, delivery_type, recipient_name").eq("user_id", userId).order("created_at", { ascending: false });
console.log(`letters: ${letters?.length}`);
for (const l of letters || []) {
  console.log(`  ${l.created_at}  ${l.status}  pi=${l.stripe_payment_intent_id ?? "—"}  $${l.amount_paid}  ${l.delivery_type}  ${l.recipient_name ?? ""}`);
}

const { data: voices } = await sb.from("voice_messages").select("id, status, created_at, stripe_payment_intent_id, message_format, amount_paid, title").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
console.log(`\nvoice_messages: ${voices?.length}`);
for (const v of voices || []) {
  console.log(`  ${v.created_at}  ${v.status}  ${v.message_format}  pi=${v.stripe_payment_intent_id ?? "—"}  $${v.amount_paid}  ${v.title}`);
}
