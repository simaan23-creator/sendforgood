import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log("Probing memory_recordings columns one at a time:");
for (const col of ["id", "request_id", "recorder_name", "audio_url", "message_format", "duration_seconds", "status", "created_at"]) {
  const r = await supabase.from("memory_recordings").select(col).limit(1);
  console.log(`  ${col.padEnd(20)} ${r.error ? "MISSING: " + r.error.message : "OK"}`);
}

console.log("\nFull select * sample row:");
const r = await supabase.from("memory_recordings").select("*").limit(1);
if (r.error) console.log("  ERR:", r.error.message);
else if (r.data?.[0]) console.log("  cols:", Object.keys(r.data[0]).join(", "));
else console.log("  (no rows)");
