#!/usr/bin/env node
/**
 * Photographer lead scraper — Step 2: email enrichment via website scraping.
 *
 * For each row in photographer_leads where status='new' and website IS NOT
 * NULL and email IS NULL, fetch the homepage + /contact + /about pages and
 * extract any email addresses. Picks the best one (prefers contact@/info@/
 * hello@, avoids noreply / wordpress / wix system addresses).
 *
 * Updates status to 'enriched' on success.
 *
 * USAGE:
 *   node scripts/leads/scrape-emails.mjs                 # process all 'new' leads with websites
 *   node scripts/leads/scrape-emails.mjs --limit=50      # cap per run (rate-limit friendly)
 *   node scripts/leads/scrape-emails.mjs --state=TX      # only one state
 *
 * NOTES:
 *   - Fully self-contained, no external API needed.
 *   - 8-second per-page timeout to avoid hanging on dead sites.
 *   - 1-second delay between leads to be polite (and not look like a bot).
 *   - Logs every lead's outcome to stdout for easy auditing.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(process.cwd());

// ---------- env loader ----------
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

// ---------- CLI args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  })
);
const LIMIT = args.limit ? parseInt(args.limit, 10) : 1000;
const STATE_FILTER = args.state || null;

// ---------- helpers ----------
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Addresses that exist on photographer sites but are NEVER the right pitch
// target — skip them so we don't email the SquareSpace bot or WordPress
// internal addresses.
const BLOCKLIST_PARTS = [
  "noreply",
  "no-reply",
  "donotreply",
  "wordpress",
  "wpengine",
  "squarespace",
  "wixsite",
  "godaddy",
  "sentry",
  "example.com",
  "domain.com",
  "yoursite",
  "youremail",
  "mailer-daemon",
  "postmaster",
];

// Preferred local-parts. Earlier in list = higher priority.
const PREFERRED_LOCALS = [
  "hello",
  "hi",
  "contact",
  "info",
  "studio",
  "bookings",
  "inquiries",
  "weddings",
];

function isBlocked(email) {
  const lower = email.toLowerCase();
  return BLOCKLIST_PARTS.some((b) => lower.includes(b));
}

function pickBestEmail(emails) {
  const unique = Array.from(new Set(emails.map((e) => e.toLowerCase())));
  const filtered = unique.filter((e) => !isBlocked(e));
  if (filtered.length === 0) return null;
  // Score: lower = better.
  function score(email) {
    const local = email.split("@")[0];
    const prefIdx = PREFERRED_LOCALS.indexOf(local);
    if (prefIdx !== -1) return prefIdx;
    // First-name-only addresses (jane@, mike@) are next best.
    if (/^[a-z]+$/.test(local) && local.length <= 12) return 100;
    return 200;
  }
  return filtered.sort((a, b) => score(a) - score(b))[0];
}

async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // A real-ish UA. Some sites block obvious bots.
        "User-Agent":
          "Mozilla/5.0 (compatible; SealTheDayBot/1.0; +https://sealtheday.com/contact)",
      },
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function normalizeBase(website) {
  try {
    const u = new URL(website);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

async function findEmailForSite(website) {
  const base = normalizeBase(website);
  if (!base) return null;
  const candidates = [base, `${base}/contact`, `${base}/about`, `${base}/contact-us`];
  const found = [];
  for (const url of candidates) {
    const html = await fetchWithTimeout(url);
    if (!html) continue;
    // Decode common HTML obfuscations: &#64; for @, [at]/(at), [dot]/(dot).
    const decoded = html
      .replace(/&#64;/g, "@")
      .replace(/&#x40;/g, "@")
      .replace(/\s*\[at\]\s*/gi, "@")
      .replace(/\s*\(at\)\s*/gi, "@")
      .replace(/\s*\[dot\]\s*/gi, ".")
      .replace(/\s*\(dot\)\s*/gi, ".");
    const matches = decoded.match(EMAIL_RE) || [];
    found.push(...matches);
    if (found.length > 0 && url !== base) break; // contact page hit is best
  }
  return pickBestEmail(found);
}

// ---------- main ----------
console.log(`\n=== Email enrichment for photographer leads ===`);
console.log(`Limit: ${LIMIT}${STATE_FILTER ? `  State: ${STATE_FILTER}` : ""}\n`);

let query = supabase
  .from("photographer_leads")
  .select("id, business_name, website, state, city")
  .eq("status", "new")
  .is("email", null)
  .not("website", "is", null)
  .limit(LIMIT);

if (STATE_FILTER) query = query.eq("state", STATE_FILTER);

const { data: leads, error } = await query;
if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

console.log(`To process: ${leads.length}\n`);

let enriched = 0;
let noEmail = 0;
let dupEmail = 0;

for (const lead of leads) {
  process.stdout.write(
    `  ${lead.business_name.slice(0, 40).padEnd(42)} ${lead.city}, ${lead.state}  `
  );
  const email = await findEmailForSite(lead.website);
  if (!email) {
    console.log("(none)");
    noEmail++;
    // Leave status='new' so we can re-try later with better selectors.
    await new Promise((r) => setTimeout(r, 1000));
    continue;
  }
  const { error: updateErr } = await supabase
    .from("photographer_leads")
    .update({
      email,
      status: "enriched",
      enriched_at: new Date().toISOString(),
    })
    .eq("id", lead.id);
  if (updateErr) {
    if (updateErr.code === "23505") {
      // Email already exists on another lead row — same studio under a
      // different place_id. Mark this row as duplicate so it doesn't show
      // up in the email queue.
      console.log(`${email}  [DUP — already in DB]`);
      await supabase
        .from("photographer_leads")
        .update({
          status: "unsubscribed",
          notes: "Duplicate email — kept original row only",
        })
        .eq("id", lead.id);
      dupEmail++;
    } else {
      console.log(`update error: ${updateErr.message}`);
    }
  } else {
    console.log(email);
    enriched++;
  }
  // Politeness delay between websites — avoids 429s and looking botty.
  await new Promise((r) => setTimeout(r, 1000));
}

console.log(`\nEnriched:    ${enriched}`);
console.log(`No email:    ${noEmail}`);
console.log(`Duplicates:  ${dupEmail}`);
console.log(
  `\nNext: pull SELECT * FROM photographer_leads WHERE status='enriched' and feed it to Instantly.ai (Task #35).\n`
);
