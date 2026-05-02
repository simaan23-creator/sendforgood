// Diagnose missing dashboard items for simaan23@gmail.com
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const EMAIL = "simaan23@gmail.com";

// 1. Find users with that email
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) { console.error("listUsers err", listErr); process.exit(1); }

const matches = list.users.filter((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
console.log(`\n=== auth users for ${EMAIL}: ${matches.length} match(es) ===`);
for (const u of matches) {
  console.log(`  id=${u.id}  created=${u.created_at}  last_sign_in=${u.last_sign_in_at ?? "never"}  confirmed=${!!u.email_confirmed_at}`);
}

if (matches.length === 0) {
  console.log("No auth user with that email. Was checkout done with a different email?");
  process.exit(0);
}

// For each user, check letters + voice_messages + orders + memory_credits
for (const u of matches) {
  console.log(`\n--- user ${u.id} ---`);

  const { data: letters } = await supabase
    .from("letters")
    .select("id, status, created_at, message_format, letter_type, recipient_name, stripe_payment_intent_id, amount_paid")
    .eq("user_id", u.id)
    .order("created_at", { ascending: false });
  console.log(`  letters: ${letters?.length ?? 0}`);
  for (const l of (letters || []).slice(0, 10)) {
    console.log(`    ${l.created_at}  status=${l.status}  type=${l.letter_type}  pi=${l.stripe_payment_intent_id?.slice(0, 20)}  $${l.amount_paid}  to=${l.recipient_name ?? "—"}`);
  }

  const { data: voices } = await supabase
    .from("voice_messages")
    .select("id, status, created_at, message_format, title, stripe_payment_intent_id, amount_paid")
    .eq("user_id", u.id)
    .order("created_at", { ascending: false });
  console.log(`  voice_messages: ${voices?.length ?? 0}`);
  for (const v of (voices || []).slice(0, 10)) {
    console.log(`    ${v.created_at}  status=${v.status}  fmt=${v.message_format}  pi=${v.stripe_payment_intent_id?.slice(0, 20)}  $${v.amount_paid}  ${v.title}`);
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, tier, status, created_at, amount_paid, stripe_payment_intent_id")
    .eq("user_id", u.id)
    .order("created_at", { ascending: false });
  console.log(`  orders: ${orders?.length ?? 0}`);
  for (const o of (orders || []).slice(0, 5)) {
    console.log(`    ${o.created_at}  tier=${o.tier}  status=${o.status}  pi=${o.stripe_payment_intent_id?.slice(0, 20)}  $${o.amount_paid}`);
  }

  const { data: credits } = await supabase
    .from("memory_credits")
    .select("audio_credits, video_credits, photo_credits, created_at")
    .eq("user_id", u.id);
  console.log(`  memory_credits rows: ${credits?.length ?? 0}`);
  for (const c of credits || []) {
    console.log(`    ${c.created_at}  audio=${c.audio_credits} video=${c.video_credits} photo=${c.photo_credits}`);
  }
}

// 2. Also search by stripe customer email in case items got orphaned
console.log(`\n=== orphan search by stripe_payment_intent (recent letters / voices not tied to any user we saw) ===`);
const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
const { data: recentLetters } = await supabase
  .from("letters")
  .select("id, user_id, status, created_at, stripe_payment_intent_id, amount_paid")
  .gte("created_at", sinceIso)
  .order("created_at", { ascending: false })
  .limit(40);
console.log(`  letters created in last 24h: ${recentLetters?.length ?? 0}`);
for (const l of recentLetters || []) {
  console.log(`    ${l.created_at}  user=${l.user_id?.slice(0, 8)}  status=${l.status}  pi=${l.stripe_payment_intent_id?.slice(0, 20)}  $${l.amount_paid}`);
}

const { data: recentVoices } = await supabase
  .from("voice_messages")
  .select("id, user_id, status, created_at, message_format, stripe_payment_intent_id, amount_paid")
  .gte("created_at", sinceIso)
  .order("created_at", { ascending: false })
  .limit(40);
console.log(`  voice_messages created in last 24h: ${recentVoices?.length ?? 0}`);
for (const v of recentVoices || []) {
  console.log(`    ${v.created_at}  user=${v.user_id?.slice(0, 8)}  fmt=${v.message_format}  status=${v.status}  pi=${v.stripe_payment_intent_id?.slice(0, 20)}  $${v.amount_paid}`);
}

console.log("\nDone.");
