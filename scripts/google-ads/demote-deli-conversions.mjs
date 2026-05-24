#!/usr/bin/env node
/**
 * Demotes 3 legacy/deli PRIMARY conversion actions to SECONDARY
 * in the SealTheDay Ads sub-account (1884911376).
 *
 *   - Calls from ads                     (7318590616)
 *   - Local actions - Directions          (7555880558)  [GBP-derived]
 *   - SendForGood (web) purchase          (7562355508)  [GA4-imported, old brand]
 *
 * "Demote" = set primary_for_goal=false. The action remains ENABLED so historical
 * data stays intact; it just stops feeding Smart Bidding as a primary signal.
 *
 * Usage:
 *   node scripts/google-ads/demote-deli-conversions.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAdsApi } from "google-ads-api";

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
const oauth = JSON.parse(
  readFileSync(resolve(ROOT, "google-ads-oauth.json"), "utf8")
).installed;
const token = JSON.parse(
  readFileSync(resolve(ROOT, "google-ads-token.json"), "utf8")
);

const client = new GoogleAdsApi({
  client_id: oauth.client_id,
  client_secret: oauth.client_secret,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  refresh_token: token.refresh_token,
});

const TARGETS = [
  { id: "7318590616", name: "Calls from ads" },
  { id: "7555880558", name: "Local actions - Directions" },
  { id: "7562355508", name: "SendForGood (web) purchase" },
];

console.log(`Demoting ${TARGETS.length} conversion actions to SECONDARY (one-by-one)...\n`);

const results = [];
for (const t of TARGETS) {
  process.stdout.write(`  -> ${t.name.padEnd(35)} `);
  try {
    await customer.conversionActions.update([
      {
        resource_name: `customers/${env.GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${t.id}`,
        primary_for_goal: false,
      },
    ]);
    console.log("OK");
    results.push({ ...t, ok: true });
  } catch (e) {
    const msg = e?.errors?.[0]?.message || e.message;
    console.log(`FAIL: ${msg}`);
    results.push({ ...t, ok: false, error: msg });
  }
}

console.log("\nSummary:");
for (const r of results) console.log(`  [${r.ok ? "OK  " : "FAIL"}] ${r.name}`);
