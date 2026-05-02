// Dry-run of the send-voice-messages cron's query against prod, to verify
// it returns rows correctly without the bogus join. Does NOT send any
// emails or mutate any data.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const today = new Date().toISOString().split("T")[0];
console.log(`Dry-run: select voice_messages where status='scheduled' and scheduled_date <= ${today} and audio_url is not null`);

const { data, error } = await supa
  .from("voice_messages")
  .select("*")
  .eq("status", "scheduled")
  .lte("scheduled_date", today)
  .not("audio_url", "is", null);

if (error) { console.log("ERR:", error.message); process.exit(1); }
console.log(`Would send ${data.length} rows today.`);
for (const m of data) {
  console.log(`  ${m.id.slice(0,8)}  to=${m.recipient_email}  scheduled_date=${m.scheduled_date}  format=${m.message_format}`);
}

// Same for letters (sanity check)
console.log(`\nLetters cron equivalent:`);
const { data: letters, error: lErr } = await supa
  .from("letters")
  .select("id, recipient_email, scheduled_date, delivery_type, content")
  .eq("delivery_type", "digital")
  .eq("status", "scheduled")
  .lte("scheduled_date", today)
  .neq("content", "");
if (lErr) console.log("ERR:", lErr.message);
else {
  console.log(`Would send ${letters.length} letters today.`);
  for (const l of letters) console.log(`  ${l.id.slice(0,8)}  to=${l.recipient_email}  scheduled_date=${l.scheduled_date}`);
}
