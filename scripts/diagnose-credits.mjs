/**
 * Diagnose why credits don't show on dashboard.
 * Pulls the most recent purchase + its user + credits + dashboard query result.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log("\n=== Most recent vault_fees ===");
const { data: fees } = await admin
  .from("vault_fees")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(3);
console.log(JSON.stringify(fees, null, 2));

console.log("\n=== Most recent memory_credits ===");
const { data: credits } = await admin
  .from("memory_credits")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5);
console.log(JSON.stringify(credits, null, 2));

console.log("\n=== Most recent stripe_webhook_events ===");
const { data: events } = await admin
  .from("stripe_webhook_events")
  .select("*")
  .order("received_at", { ascending: false })
  .limit(5);
console.log(JSON.stringify(events, null, 2));

if (credits && credits.length > 0) {
  const userId = credits[0].user_id;
  console.log(`\n=== User ${userId} ===`);
  const { data: userInfo } = await admin.auth.admin.getUserById(userId);
  console.log("Email:", userInfo?.user?.email);
  console.log("Last sign-in:", userInfo?.user?.last_sign_in_at);

  // Sum credits like the dashboard does
  const { data: userCredits } = await admin
    .from("memory_credits")
    .select("audio_credits, video_credits, photo_credits")
    .eq("user_id", userId);
  const totalAudio = (userCredits || []).reduce((s, r) => s + (r.audio_credits || 0), 0);
  const totalVideo = (userCredits || []).reduce((s, r) => s + (r.video_credits || 0), 0);
  const totalPhoto = (userCredits || []).reduce((s, r) => s + (r.photo_credits || 0), 0);
  console.log(`Totals: audio=${totalAudio} video=${totalVideo} photo=${totalPhoto}`);

  const { data: userFees } = await admin
    .from("vault_fees")
    .select("id, used_at")
    .eq("user_id", userId);
  console.log(`Vault fees: total=${userFees?.length}, unused=${userFees?.filter((f) => !f.used_at).length}`);
}
