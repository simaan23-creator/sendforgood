// Quick campaign status probe.
import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const url = env.SUPABASE_DB_URL;
if (!url) { console.error("Missing SUPABASE_DB_URL"); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

async function q(sql, params=[]) {
  const r = await client.query(sql, params);
  return r.rows;
}

console.log("=== AFFILIATES (last 20) ===");
console.log(await q(`select code, business_name, email, created_at, gift_credits, active
                    from affiliates order by created_at desc limit 20`));

console.log("\n=== REFERRALS schema ===");
console.log(await q(`select column_name, data_type from information_schema.columns
                     where table_name = 'affiliate_referrals' order by ordinal_position`));

console.log("\n=== REFERRALS count ===");
console.log(await q(`select count(*) as total, count(*) filter (where paid) as paid
                     from affiliate_referrals`));

console.log("\n=== OUTREACH EVENTS schema ===");
console.log(await q(`select column_name from information_schema.columns
                     where table_name = 'lead_outreach_events' order by ordinal_position`));

console.log("\n=== OUTREACH EVENTS by day (last 10 days) ===");
console.log(await q(`select date(sent_at) as d, count(*)
                     from lead_outreach_events
                     where sent_at >= now() - interval '10 days'
                     group by 1 order by 1 desc`));

console.log("\n=== LEAD STATUS ===");
console.log(await q(`select status, count(*) from photographer_leads group by 1 order by 2 desc`));

console.log("\n=== UNSUBSCRIBES (last 14d) ===");
console.log(await q(`select count(*) from lead_unsubscribes where unsubscribed_at >= now() - interval '14 days'`));

console.log("\n=== CRON RUN LOG (last 10 runs) ===");
try {
  console.log(await q(`select run_date, started_at, finished_at, events_sent
                       from cron_run_log
                       where cron_name = 'cold-outreach'
                       order by run_date desc limit 10`));
} catch (e) { console.log("(table missing or error)", e.message); }

await client.end();
