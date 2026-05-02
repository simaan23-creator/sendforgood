import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const cols = ["id", "credit_id", "recipient_name", "occasion_type", "occasion_date", "scheduled_year", "status"];
console.log("Probing gift_assignments columns one-by-one:");
for (const c of cols) {
  const r = await supa.from("gift_assignments").select(c).limit(1);
  console.log(`  ${c.padEnd(18)} ${r.error ? "MISSING: " + r.error.message : "OK"}`);
}

console.log("\nFull row sample (select *):");
const r = await supa.from("gift_assignments").select("*").limit(1);
if (r.error) console.log("ERR:", r.error.message);
else if (r.data?.[0]) console.log(" cols:", Object.keys(r.data[0]).join(", "));
else console.log(" (no rows)");
