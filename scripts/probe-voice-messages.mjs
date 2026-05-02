import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await supabase.from("voice_messages").select("*").limit(1);
if (error) {
  console.log("ERR:", error.message);
  process.exit(1);
}
console.log("Sample row keys:", data.length > 0 ? Object.keys(data[0]).sort() : "(no rows)");

// Try the fields the PATCH route writes:
const probe = await supabase.from("voice_messages").select("id, recipient_name, recipient_email, scheduled_date, milestone_label, audio_url, duration_seconds, status, title, letter_type").limit(1);
console.log("Field probe:", probe.error ? `ERR: ${probe.error.message}` : "OK — all fields exist");
