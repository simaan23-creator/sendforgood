import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Try multiple approaches
console.log("1. Direct table select:");
const r1 = await supabase.from("stripe_webhook_events").select("*").limit(1);
console.log("   ", r1.error ? `ERR: ${r1.error.message} (code ${r1.error.code})` : `OK: ${r1.data?.length} rows`);

console.log("\n2. Insert test row:");
const r2 = await supabase.from("stripe_webhook_events").insert({ id: "evt_test_" + Date.now(), type: "test" }).select();
console.log("   ", r2.error ? `ERR: ${r2.error.message} (code ${r2.error.code})` : `OK: inserted ${r2.data?.length} rows`);

console.log("\n3. Check via information_schema using rpc/raw SQL:");
const r3 = await supabase.rpc("exec_sql", { query: "SELECT to_regclass('public.stripe_webhook_events') AS tbl" });
console.log("   rpc result:", r3.error ? `ERR: ${r3.error.message}` : JSON.stringify(r3.data));
