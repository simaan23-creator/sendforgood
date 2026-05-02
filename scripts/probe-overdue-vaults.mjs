// Identify vaults that should have been delivered (delivery_date in past,
// status='active') but weren't, because the send-memory-recordings cron
// has been silently failing on the missing `status` column on memory_recordings.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const today = new Date().toISOString().slice(0, 10);

const { data: vaults, error } = await supabase
  .from("memory_requests")
  .select("id, requester_id, requester_email, title, delivery_date, sealed_until, status, created_at")
  .eq("status", "active")
  .lte("delivery_date", today)
  .order("delivery_date", { ascending: true });

if (error) { console.error(error); process.exit(1); }

console.log(`Today (UTC): ${today}\n`);
console.log(`Active vaults whose delivery_date has passed: ${vaults.length}\n`);

for (const v of vaults) {
  // count pending recordings on this vault
  const { count: pendingCount } = await supabase
    .from("memory_recordings")
    .select("id", { count: "exact", head: true })
    .eq("request_id", v.id)
    .eq("status", "pending");

  const { count: totalCount } = await supabase
    .from("memory_recordings")
    .select("id", { count: "exact", head: true })
    .eq("request_id", v.id);

  console.log(`  ${v.id}`);
  console.log(`    title:     ${v.title}`);
  console.log(`    requester: ${v.requester_email}`);
  console.log(`    delivery:  ${v.delivery_date}  (${Math.floor((Date.parse(today) - Date.parse(v.delivery_date)) / 86400000)} days ago)`);
  console.log(`    seal:      ${v.sealed_until ?? "none"}`);
  console.log(`    recordings: ${totalCount} total, ${pendingCount} pending delivery`);
  console.log();
}
