#!/usr/bin/env node
/**
 * Quick performance snapshot of all Google Ads campaigns on the account.
 *
 * Prints, per campaign:
 *   - status, daily budget, total spend, impressions, clicks, CTR, avg CPC,
 *     conversions, cost-per-conversion
 *   - separately for: last 7 days, last 30 days, all time
 *
 * USAGE: node scripts/google-ads/campaign-stats.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAdsApi } from "google-ads-api";

const ROOT = resolve(process.cwd());
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/).filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const oauth = JSON.parse(readFileSync(resolve(ROOT, "google-ads-oauth.json"), "utf8")).installed;
const token = JSON.parse(readFileSync(resolve(ROOT, "google-ads-token.json"), "utf8"));

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

// micros (Google's unit) → dollars
const $ = (micros) => (Number(micros || 0) / 1_000_000).toFixed(2);

async function pull(range) {
  const where = range === "all"
    ? ""
    : `AND segments.date DURING ${range}`;
  return customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ${where}
  `);
}

function aggregate(rows) {
  // Group by campaign id; sum metrics across rows (each row is per-day if
  // a date range is applied, single-row per campaign for "all").
  const byId = new Map();
  for (const r of rows) {
    const id = r.campaign.id;
    const cur = byId.get(id) || {
      id,
      name: r.campaign.name,
      status: r.campaign.status,
      budget_micros: r.campaign_budget?.amount_micros || 0,
      impressions: 0, clicks: 0, cost_micros: 0, conversions: 0,
    };
    cur.impressions += Number(r.metrics?.impressions || 0);
    cur.clicks += Number(r.metrics?.clicks || 0);
    cur.cost_micros += Number(r.metrics?.cost_micros || 0);
    cur.conversions += Number(r.metrics?.conversions || 0);
    byId.set(id, cur);
  }
  return [...byId.values()].sort((a, b) => b.cost_micros - a.cost_micros);
}

function fmt(c) {
  const ctr = c.impressions ? ((c.clicks / c.impressions) * 100).toFixed(2) + "%" : "—";
  const cpc = c.clicks ? "$" + $(c.cost_micros / c.clicks) : "—";
  const cpa = c.conversions > 0 ? "$" + $(c.cost_micros / c.conversions) : "—";
  return {
    name: c.name.slice(0, 48),
    status: c.status,
    budget: c.budget_micros ? "$" + $(c.budget_micros) + "/d" : "—",
    impr: c.impressions.toLocaleString(),
    clicks: c.clicks.toLocaleString(),
    ctr,
    cpc,
    spend: "$" + $(c.cost_micros),
    conv: c.conversions.toFixed(2),
    cpa,
  };
}

function printTable(label, rows) {
  console.log(`\n=== ${label} ===`);
  if (rows.length === 0) {
    console.log("  (no campaigns)");
    return;
  }
  const f = rows.map(fmt);
  const cols = ["name", "status", "budget", "impr", "clicks", "ctr", "cpc", "spend", "conv", "cpa"];
  const widths = Object.fromEntries(cols.map(c => [c, Math.max(c.length, ...f.map(r => String(r[c]).length))]));
  const header = cols.map(c => c.padEnd(widths[c])).join("  ");
  console.log(header);
  console.log(cols.map(c => "-".repeat(widths[c])).join("  "));
  for (const row of f) {
    console.log(cols.map(c => String(row[c]).padEnd(widths[c])).join("  "));
  }
}

const ranges = [
  ["Last 7 days",  "LAST_7_DAYS"],
  ["Last 30 days", "LAST_30_DAYS"],
  ["All time",     "all"],
];

for (const [label, key] of ranges) {
  const rows = await pull(key);
  printTable(label, aggregate(rows));
}

console.log("");
