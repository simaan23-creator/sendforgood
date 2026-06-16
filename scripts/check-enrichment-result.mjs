#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/).filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const client = new pg.Client({ connectionString: env.SUPABASE_DB_URL });
await client.connect();

// Full status distribution
const { rows: all } = await client.query(`
  select status, count(*) as n
  from photographer_leads
  group by status
  order by count(*) desc
`);
console.log("=== photographer_leads status distribution ===");
let total = 0;
for (const r of all) { console.log(`  ${r.n.toString().padStart(5)}  ${r.status}`); total += parseInt(r.n); }
console.log(`  ${total.toString().padStart(5)}  TOTAL`);
console.log("");

// Newly enriched in last hour
const { rows: recent } = await client.query(`
  select count(*) as n
  from photographer_leads
  where status = 'enriched'
    and updated_at >= now() - interval '1 hour'
`);
console.log(`Newly enriched in last hour: ${recent[0].n}`);

// Sample 10 newly enriched
const { rows: sample } = await client.query(`
  select business_name, city, state, email
  from photographer_leads
  where status = 'enriched'
    and updated_at >= now() - interval '1 hour'
  order by updated_at desc
  limit 10
`);
console.log("");
console.log("=== Sample of newly enriched ===");
for (const r of sample) {
  console.log(`  ${r.business_name.padEnd(40).slice(0,40)}  ${r.city}, ${r.state}  →  ${r.email}`);
}

await client.end();
