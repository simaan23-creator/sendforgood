// One-shot reconcile: bump existing voice_messages rows to the status the
// new edit-page logic would have written. Safe because (a) we only touch
// rows that are NOT already delivered/vault_allocated and (b) we only
// promote when all required fields are present.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await supa
  .from("voice_messages")
  .select("id, status, letter_type, scheduled_date, milestone_label, recipient_email, audio_url");
if (error) { console.log("ERR:", error.message); process.exit(1); }

let bumped = 0;
for (const r of data) {
  if (["delivered", "vault_allocated"].includes(r.status)) continue;
  if (!r.audio_url) continue;
  if (!r.recipient_email) continue;
  let target = null;
  if (r.letter_type === "annual" && r.scheduled_date) target = "scheduled";
  else if (r.letter_type === "milestone" && r.milestone_label) target = "pending_release";
  if (!target || target === r.status) continue;
  const { error: updErr } = await supa
    .from("voice_messages")
    .update({ status: target })
    .eq("id", r.id);
  if (updErr) console.log(`  FAIL ${r.id}:`, updErr.message);
  else { console.log(`  ${r.id} ${r.status} -> ${target}`); bumped++; }
}
console.log(`\nBumped ${bumped} rows.`);
