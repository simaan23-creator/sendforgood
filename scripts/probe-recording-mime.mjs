import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: recs, error } = await supabase
  .from("memory_recordings")
  .select("id, message_format, audio_url, created_at")
  .order("created_at", { ascending: false })
  .limit(8);

if (error) { console.error("DB err:", error); process.exit(1); }

console.log(`Found ${recs.length} recent recordings:\n`);
for (const r of recs) {
  console.log(`[${r.message_format}] ${r.audio_url}`);
  try {
    const head = await fetch(r.audio_url, { method: "HEAD" });
    console.log(`   status: ${head.status}`);
    console.log(`   content-type: ${head.headers.get("content-type")}`);
    console.log(`   content-length: ${head.headers.get("content-length")}`);
    console.log(`   accept-ranges: ${head.headers.get("accept-ranges")}`);
  } catch (e) {
    console.log(`   ERR: ${e.message}`);
  }
  console.log();
}
