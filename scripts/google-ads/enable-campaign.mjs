#!/usr/bin/env node
/**
 * Flip a Google Ads campaign from PAUSED → ENABLED.
 *
 * USAGE:
 *   node scripts/google-ads/enable-campaign.mjs                       # enable the wedding search campaign by name
 *   node scripts/google-ads/enable-campaign.mjs --id=23889632127      # enable by explicit id
 *   node scripts/google-ads/enable-campaign.mjs --pause --id=...      # pause it again
 *
 * Reads creds the same way the other scripts in this dir do.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAdsApi, enums } from "google-ads-api";

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

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  })
);
const TARGET_NAME = args.name || "SealTheDay — Wedding Memories (Search) [PAUSED draft]";
const TARGET_STATUS = args.pause === "true"
  ? enums.CampaignStatus.PAUSED
  : enums.CampaignStatus.ENABLED;
const STATUS_LABEL = TARGET_STATUS === enums.CampaignStatus.ENABLED ? "ENABLED" : "PAUSED";

let campaignId = args.id || null;
if (!campaignId) {
  const safe = TARGET_NAME.replace(/'/g, "\\'");
  const rows = await customer.query(`
    SELECT campaign.id, campaign.name, campaign.status
    FROM campaign
    WHERE campaign.name = '${safe}'
  `);
  if (rows.length === 0) {
    console.error(`No campaign found with name: ${TARGET_NAME}`);
    process.exit(1);
  }
  campaignId = rows[0].campaign.id;
  console.log(`Found campaign id=${campaignId} (current status=${rows[0].campaign.status})`);
}

await customer.campaigns.update([
  {
    resource_name: `customers/${env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    status: TARGET_STATUS,
  },
]);

console.log(`\nDone. Campaign ${campaignId} is now ${STATUS_LABEL}.`);
if (STATUS_LABEL === "ENABLED") {
  console.log("Impressions usually start within 1-2 hours.");
  console.log("Monitor at: https://ads.google.com/aw/campaigns?ocid=&campaignId=" + campaignId);
}
