#!/usr/bin/env node
/**
 * Lists all conversion actions in the SealTheDay Ads sub-account.
 * Confirms API auth works and surfaces resource names + categories
 * for the demote/create scripts.
 *
 * Usage:
 *   node scripts/google-ads/list-conversions.mjs
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

const rows = await customer.query(`
  SELECT
    conversion_action.id,
    conversion_action.name,
    conversion_action.status,
    conversion_action.type,
    conversion_action.category,
    conversion_action.primary_for_goal,
    conversion_action.origin,
    conversion_action.resource_name
  FROM conversion_action
  ORDER BY conversion_action.name
`);

console.log(`\nFound ${rows.length} conversion actions in customer ${env.GOOGLE_ADS_CUSTOMER_ID}:\n`);
for (const r of rows) {
  const ca = r.conversion_action;
  console.log(
    `  [${ca.primary_for_goal ? "PRIMARY  " : "SECONDARY"}] ` +
      `${ca.status}  ${ca.name}`
  );
  console.log(`              type=${ca.type}  category=${ca.category}  origin=${ca.origin}`);
  console.log(`              resource=${ca.resource_name}\n`);
}
