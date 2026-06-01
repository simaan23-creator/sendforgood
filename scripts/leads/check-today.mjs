#!/usr/bin/env node
/**
 * Quick check: what did the cold-outreach cron do today (UTC)?
 * USAGE: node scripts/leads/check-today.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/).filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const since = new Date();
since.setUTCHours(0, 0, 0, 0);
const sinceIso = since.toISOString();

// Discover columns dynamically since table schema may not have created_at
const probe = await sb.from("lead_outreach_events").select("*").limit(1);
if (probe.error) { console.error(probe.error); process.exit(1); }
const cols = Object.keys(probe.data[0] || {});
console.log("columns:", cols.join(", "));
const tsCol = cols.includes("sent_at") ? "sent_at" : cols.includes("created_at") ? "created_at" : null;
if (!tsCol) { console.error("no timestamp column"); process.exit(1); }

const { data, error } = await sb
  .from("lead_outreach_events")
  .select("*")
  .gte(tsCol, sinceIso)
  .order(tsCol, { ascending: true });

if (error) { console.error(error); process.exit(1); }

console.log(`Events since ${sinceIso} (today UTC): ${data.length}`);
for (const e of data) {
  console.log(`  ${e[tsCol]}  step=${e.sequence_step}  ${(e.status||"").padEnd(6)}  ${e.to_address}  ${e.resend_message_id || e.error || ""}`);
}
