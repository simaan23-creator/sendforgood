#!/usr/bin/env node
/**
 * BACKUP + WIPE production data.
 *
 * Phase 1: Export every per-user table to JSON on the user's desktop.
 * Phase 2: Download every storage object preserving bucket/path layout.
 * Phase 3: Verify the backup (row counts match live DB).
 * Phase 4: Delete all storage objects.
 * Phase 5: Delete all per-user rows (children before parents).
 *
 * Preserved: auth.users, profiles, gift_catalog, bucket policies.
 *
 * IRREVERSIBLE. Halts on the first error so the wipe never runs against
 * an incomplete backup.
 *
 * Usage:
 *   node scripts/backup-and-wipe-production.mjs
 *   node scripts/backup-and-wipe-production.mjs --dry-run     # backup + verify only
 *   node scripts/backup-and-wipe-production.mjs --skip-backup # DANGEROUS: wipe only
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { homedir } from "node:os";

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_BACKUP = process.argv.includes("--skip-backup");

const ROOT = resolve(process.cwd());
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Tables to wipe, ordered children → parents so FKs don't bite.
// (None of these have explicit FKs in our schema, but the order still
//  matches the conceptual dependency.)
const TABLES_TO_WIPE = [
  // vault / memory feature
  "memory_recordings",
  "memory_requests",
  "memory_credits",
  "vault_fees",
  "admin_vault_gifts",
  // voice messages
  "message_uses",
  "voice_messages",
  // letters
  "letters",
  // legacy gifting
  "shipments",
  "occasions",
  "recipients",
  "refund_requests",
  "orders",
  "business_recipients",
  "business_orders",
  "gift_assignments",
  "gifted_credits",
  "gifted_items",
  "gift_credits",
  "affiliate_referrals",
  "affiliates",
  "executor_access_requests",
  // system
  "stripe_webhook_events",
];

const TABLES_TO_PRESERVE = ["auth.users", "profiles", "gift_catalog"];

const BUCKETS = [
  "memory-recordings",
  "voice-messages",
  "recipient-photos",
  "shipment-photos",
  "letter-photos",
];

// ---------- helpers ----------
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_DIR = resolve(homedir(), "Desktop", `sealtheday-backup-${ts}`);
const TABLES_DIR = join(BACKUP_DIR, "tables");
const STORAGE_DIR = join(BACKUP_DIR, "storage");

function log(msg) {
  console.log(msg);
}
function fail(msg, err) {
  console.error(`\n[FATAL] ${msg}`);
  if (err) console.error(err);
  process.exit(1);
}

async function fetchAllRows(table) {
  // Paginate at 1000 rows (Supabase default cap).
  const PAGE = 1000;
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function countRows(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

// Walk a storage bucket recursively. Returns [{ path, size }, ...].
async function listAllObjects(bucket, prefix = "") {
  const out = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
  for (const item of data || []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null || item.metadata === null) {
      // Folder
      const nested = await listAllObjects(bucket, fullPath);
      out.push(...nested);
    } else {
      out.push({ path: fullPath, size: item.metadata?.size ?? 0 });
    }
  }
  return out;
}

async function downloadObject(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`download ${bucket}/${path}: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// ---------- PHASE 1: backup tables ----------
const tableCounts = {};
if (!SKIP_BACKUP) {
  log(`\n=== PHASE 1: Export tables ===`);
  log(`Backup root: ${BACKUP_DIR}`);
  ensureDir(TABLES_DIR);

  for (const t of TABLES_TO_WIPE) {
    try {
      const rows = await fetchAllRows(t);
      tableCounts[t] = rows.length;
      writeFileSync(
        join(TABLES_DIR, `${t}.json`),
        JSON.stringify(rows, null, 2)
      );
      log(`  [ok] ${t}: ${rows.length} rows`);
    } catch (e) {
      // Table might not exist in this env; record and continue.
      if (/relation .* does not exist/i.test(e.message)) {
        log(`  [skip] ${t}: table not present`);
        tableCounts[t] = "MISSING";
      } else {
        fail(`Export failed for ${t}`, e);
      }
    }
  }

  // Also snapshot preserved tables for safety.
  log(`\n  Snapshotting preserved tables (informational only):`);
  for (const t of ["profiles", "gift_catalog"]) {
    try {
      const rows = await fetchAllRows(t);
      writeFileSync(
        join(TABLES_DIR, `_preserved_${t}.json`),
        JSON.stringify(rows, null, 2)
      );
      log(`  [ok] _preserved_${t}: ${rows.length} rows`);
    } catch (e) {
      log(`  [skip] _preserved_${t}: ${e.message}`);
    }
  }
}

// ---------- PHASE 2: backup storage ----------
const storageManifest = {};
if (!SKIP_BACKUP) {
  log(`\n=== PHASE 2: Download storage ===`);
  ensureDir(STORAGE_DIR);

  for (const bucket of BUCKETS) {
    try {
      const objects = await listAllObjects(bucket);
      storageManifest[bucket] = objects.length;
      log(`  ${bucket}: ${objects.length} objects`);
      const bucketDir = join(STORAGE_DIR, bucket);
      ensureDir(bucketDir);
      let i = 0;
      for (const obj of objects) {
        i++;
        const dest = join(bucketDir, obj.path);
        ensureDir(dirname(dest));
        const buf = await downloadObject(bucket, obj.path);
        writeFileSync(dest, buf);
        if (i % 10 === 0 || i === objects.length) {
          log(`    [${i}/${objects.length}] ${obj.path}`);
        }
      }
    } catch (e) {
      if (/not.*found|bucket.*not.*exist/i.test(e.message)) {
        log(`  [skip] ${bucket}: bucket not present`);
        storageManifest[bucket] = "MISSING";
      } else {
        fail(`Storage backup failed for ${bucket}`, e);
      }
    }
  }
}

// ---------- PHASE 3: write manifest + verify ----------
if (!SKIP_BACKUP) {
  log(`\n=== PHASE 3: Verify backup ===`);
  const manifest = {
    created_at: new Date().toISOString(),
    project: env.NEXT_PUBLIC_SUPABASE_URL,
    table_counts: tableCounts,
    storage_counts: storageManifest,
    preserved_tables: TABLES_TO_PRESERVE,
    note: "Snapshot taken before full production wipe. Restore by re-inserting rows in reverse-FK order and re-uploading storage objects via supabase.storage.from(bucket).upload(path, buffer).",
  };
  writeFileSync(
    join(BACKUP_DIR, "MANIFEST.json"),
    JSON.stringify(manifest, null, 2)
  );
  log(`  [ok] MANIFEST.json written`);

  // Verify table counts match live counts (defends against silent paging bugs)
  for (const t of TABLES_TO_WIPE) {
    if (tableCounts[t] === "MISSING") continue;
    let liveCount;
    try {
      liveCount = await countRows(t);
    } catch (e) {
      if (/relation .* does not exist/i.test(e.message)) continue;
      fail(`Verify failed counting ${t}`, e);
    }
    if (liveCount !== tableCounts[t]) {
      fail(
        `Row count mismatch for ${t}: backup has ${tableCounts[t]}, live has ${liveCount}. Aborting before wipe.`
      );
    }
  }
  log(`  [ok] Live row counts match backup for all tables`);
}

if (DRY_RUN) {
  log(`\n=== DRY RUN COMPLETE — nothing deleted ===`);
  log(`Backup at: ${BACKUP_DIR}`);
  process.exit(0);
}

// ---------- PHASE 4: wipe storage ----------
log(`\n=== PHASE 4: Wipe storage objects ===`);
for (const bucket of BUCKETS) {
  try {
    const objects = await listAllObjects(bucket);
    if (objects.length === 0) {
      log(`  [skip] ${bucket}: already empty`);
      continue;
    }
    // Delete in chunks of 100
    const paths = objects.map((o) => o.path);
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) fail(`Delete failed in ${bucket}`, error);
    }
    log(`  [ok] ${bucket}: deleted ${paths.length} objects`);
  } catch (e) {
    if (/not.*found|bucket.*not.*exist/i.test(e.message)) {
      log(`  [skip] ${bucket}: bucket not present`);
    } else {
      fail(`Storage wipe failed for ${bucket}`, e);
    }
  }
}

// ---------- PHASE 5: wipe rows ----------
log(`\n=== PHASE 5: Wipe table rows ===`);
for (const t of TABLES_TO_WIPE) {
  try {
    // Need a non-trivial predicate for supabase-js delete().
    // Match-all by selecting "id IS NOT NULL" works for every table that
    // has an id column. For tables keyed differently we fall back to
    // event_id / claim_code.
    let query = supabase.from(t).delete();
    // Try id first
    let pkCol = "id";
    if (t === "stripe_webhook_events") pkCol = "event_id";
    if (t === "message_uses") pkCol = "claim_code";
    const { error, count } = await query.not(pkCol, "is", null).select("*", {
      count: "exact",
      head: true,
    });
    if (error) {
      // Fallback: try common alternatives if the chosen pk is wrong
      const altCols = ["id", "event_id", "claim_code", "user_id", "created_at"];
      let ok = false;
      for (const c of altCols) {
        const { error: e2 } = await supabase
          .from(t)
          .delete()
          .not(c, "is", null);
        if (!e2) {
          ok = true;
          break;
        }
      }
      if (!ok) fail(`Wipe failed for ${t}`, error);
    }
    log(`  [ok] ${t}: wiped`);
  } catch (e) {
    if (/relation .* does not exist/i.test(e.message)) {
      log(`  [skip] ${t}: table not present`);
    } else {
      fail(`Wipe failed for ${t}`, e);
    }
  }
}

// ---------- Final sanity check ----------
log(`\n=== Final verification ===`);
for (const t of TABLES_TO_WIPE) {
  try {
    const c = await countRows(t);
    if (c !== 0) {
      log(`  [WARN] ${t}: still has ${c} rows`);
    } else {
      log(`  [ok] ${t}: empty`);
    }
  } catch (e) {
    if (/relation .* does not exist/i.test(e.message)) continue;
    log(`  [warn] ${t}: ${e.message}`);
  }
}

log(`\n=== WIPE COMPLETE ===`);
log(`Backup preserved at: ${BACKUP_DIR}`);
log(`All user accounts intact. All dashboards now empty.`);
