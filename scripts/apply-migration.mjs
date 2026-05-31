#!/usr/bin/env node
/**
 * One-shot migration runner.
 *
 * Reads SUPABASE_DB_URL from .env.local and applies each SQL file passed
 * as an argument, in order, in a single transaction per file.
 *
 * USAGE:
 *   node scripts/apply-migration.mjs supabase/migrations/031_photographer_leads.sql supabase/migrations/032_lead_outreach.sql
 *
 * Note: this is a deliberately tiny runner — it does NOT track which
 * migrations have been applied. Re-running is safe because every
 * migration in this repo uses `if not exists`. For real migration
 * tracking, use the Supabase CLI (`supabase db push`).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

if (!env.SUPABASE_DB_URL) {
  console.error("ERROR: SUPABASE_DB_URL missing from .env.local");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("USAGE: node scripts/apply-migration.mjs <file.sql> [...]");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log(`Connected to ${env.SUPABASE_DB_URL.replace(/:[^:@]+@/, ":***@")}`);

for (const file of files) {
  const sql = readFileSync(resolve(process.cwd(), file), "utf8");
  console.log(`\n→ applying ${file} (${sql.length} bytes)`);
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`  ok`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`  FAIL: ${e.message}`);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(`\nDone.`);
